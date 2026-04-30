import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // Get Stripe secret key
    let STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_SECRET_KEY) {
      const { data: setting } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "stripe_secret_key")
        .maybeSingle();
      STRIPE_SECRET_KEY = setting?.value || null;
    }

    if (!STRIPE_SECRET_KEY) {
      return new Response(JSON.stringify({ error: "Stripe not configured" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get metered price IDs
    const { data: priceSettings } = await supabase
      .from("platform_settings")
      .select("key, value")
      .in("key", ["stripe_sms_price_id", "stripe_whatsapp_price_id"]);

    const priceMap: Record<string, string> = {};
    (priceSettings || []).forEach((s: any) => { priceMap[s.key] = s.value; });

    const smsPriceId = priceMap["stripe_sms_price_id"];
    const waPriceId = priceMap["stripe_whatsapp_price_id"];

    if (!smsPriceId && !waPriceId) {
      return new Response(JSON.stringify({ skipped: true, reason: "no_metered_price_ids" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get unreported usage grouped by salon + channel
    const { data: unreported } = await supabase
      .from("messaging_usage_log")
      .select("id, salon_user_id, channel")
      .eq("reported_to_stripe", false)
      .limit(1000);

    if (!unreported || unreported.length === 0) {
      return new Response(JSON.stringify({ reported: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Group by salon_user_id + channel
    const groups: Record<string, { ids: string[]; count: number; channel: string; salon_user_id: string }> = {};
    for (const row of unreported) {
      const key = `${row.salon_user_id}:${row.channel}`;
      if (!groups[key]) {
        groups[key] = { ids: [], count: 0, channel: row.channel, salon_user_id: row.salon_user_id };
      }
      groups[key].ids.push(row.id);
      groups[key].count++;
    }

    let totalReported = 0;

    for (const group of Object.values(groups)) {
      const channelPriceId = group.channel === "sms" ? smsPriceId : waPriceId;
      if (!channelPriceId) continue;

      // Get subscription for this salon
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("stripe_subscription_id")
        .eq("user_id", group.salon_user_id)
        .eq("status", "active")
        .is("deleted_at", null)
        .maybeSingle();

      if (!sub?.stripe_subscription_id) {
        console.log(`No active subscription for salon ${group.salon_user_id}, skipping`);
        continue;
      }

      // Find the subscription item for this metered price
      const subItemsRes = await fetch(
        `https://api.stripe.com/v1/subscription_items?subscription=${sub.stripe_subscription_id}`,
        {
          headers: { "Authorization": `Bearer ${STRIPE_SECRET_KEY}` },
        }
      );
      const subItems = await subItemsRes.json();

      const matchingItem = subItems.data?.find(
        (item: any) => item.price?.id === channelPriceId
      );

      if (!matchingItem) {
        console.log(`No subscription item found for price ${channelPriceId} on sub ${sub.stripe_subscription_id}`);
        continue;
      }

      // Report usage to Stripe
      const usageRes = await fetch(
        `https://api.stripe.com/v1/subscription_items/${matchingItem.id}/usage_records`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            quantity: String(group.count),
            action: "increment",
            timestamp: String(Math.floor(Date.now() / 1000)),
          }),
        }
      );

      if (!usageRes.ok) {
        const err = await usageRes.json();
        console.error(`Stripe usage record error for ${group.salon_user_id}/${group.channel}:`, err);
        continue;
      }

      // Mark as reported
      const batchSize = 100;
      for (let i = 0; i < group.ids.length; i += batchSize) {
        const batch = group.ids.slice(i, i + batchSize);
        await supabase
          .from("messaging_usage_log")
          .update({ reported_to_stripe: true })
          .in("id", batch);
      }

      totalReported += group.count;
      console.log(`Reported ${group.count} ${group.channel} usage for salon ${group.salon_user_id}`);
    }

    return new Response(JSON.stringify({ reported: totalReported }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in report-messaging-usage:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

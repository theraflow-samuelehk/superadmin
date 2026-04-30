import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
      },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_SECRET_KEY) {
      const { data: s1 } = await supabase.from("platform_settings").select("value").eq("key", "stripe_secret_key").maybeSingle();
      STRIPE_SECRET_KEY = s1?.value || null;
    }
    let STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!STRIPE_WEBHOOK_SECRET) {
      const { data: s2 } = await supabase.from("platform_settings").select("value").eq("key", "stripe_webhook_secret").maybeSingle();
      STRIPE_WEBHOOK_SECRET = s2?.value || null;
    }
    if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
      return new Response("Stripe non configurato", { status: 503 });
    }

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    if (!signature) throw new Error("No signature");

    // Verify Stripe webhook signature cryptographically
    const parts = signature.split(",").reduce((acc: Record<string, string>, part: string) => {
      const [key, val] = part.split("=");
      acc[key.trim()] = val;
      return acc;
    }, {} as Record<string, string>);

    const timestamp = parts["t"];
    const receivedSig = parts["v1"];
    if (!timestamp || !receivedSig) throw new Error("Invalid signature format");

    const eventAge = Math.floor(Date.now() / 1000) - parseInt(timestamp);
    if (eventAge > 300) throw new Error("Webhook timestamp too old");

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(STRIPE_WEBHOOK_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signedPayload = encoder.encode(`${timestamp}.${body}`);
    const expectedSigBuffer = await crypto.subtle.sign("HMAC", key, signedPayload);
    const expectedSig = Array.from(new Uint8Array(expectedSigBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (expectedSig !== receivedSig) {
      console.error("Stripe webhook signature mismatch");
      return new Response("Invalid signature", { status: 401 });
    }

    const event = JSON.parse(body);
    console.log("Stripe webhook event:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;

        // ── Shop order payment ──
        const shopOrderId = session.metadata?.shop_order_id;
        const salonUserId = session.metadata?.salon_user_id;
        if (shopOrderId) {
          await supabase
            .from("shop_orders")
            .update({
              status: "new",
              notes: `stripe_payment_intent:${session.payment_intent}`,
              updated_at: new Date().toISOString(),
            })
            .eq("id", shopOrderId);
          console.log("Shop order paid:", shopOrderId);

          if (salonUserId) {
            try {
              const { data: order } = await supabase
                .from("shop_orders")
                .select("customer_phone, customer_name, order_number")
                .eq("id", shopOrderId)
                .single();

              if (order?.customer_phone) {
                const { data: profile } = await supabase
                  .from("profiles")
                  .select("salon_name")
                  .eq("user_id", salonUserId)
                  .single();

                const salonName = profile?.salon_name || "GlowUp";
                const smsBody = `${salonName}: Ordine ${order.order_number} confermato! Grazie ${order.customer_name || ""} per il tuo acquisto.`;

                const { data: logEntry } = await supabase
                  .from("sms_delivery_log")
                  .insert({
                    salon_user_id: salonUserId,
                    order_id: shopOrderId,
                    phone: order.customer_phone,
                    message_body: smsBody,
                    status: "sending",
                  })
                  .select("id")
                  .single();

                await fetch(`${supabaseUrl}/functions/v1/send-sms`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${supabaseKey}`,
                  },
                  body: JSON.stringify({
                    salon_user_id: salonUserId,
                    to: order.customer_phone,
                    body: smsBody,
                    track_delivery: true,
                    delivery_log_id: logEntry?.id,
                  }),
                });
                console.log("Order confirmation SMS sent for order:", shopOrderId);
              }
            } catch (smsErr) {
              console.error("Failed to send order confirmation SMS:", smsErr);
            }
          }
          break;
        }

        // ── Messaging subscription checkout ──
        const subType = session.metadata?.type;
        if (subType === "messaging") {
          const userId = session.metadata?.user_id;
          if (userId) {
            await supabase.from("messaging_subscriptions").insert({
              user_id: userId,
              status: "active",
              stripe_customer_id: session.customer,
              stripe_subscription_id: session.subscription,
            });
            console.log("Messaging subscription created for user:", userId);
          }
          break;
        }

        // ── Plan subscription checkout ──
        const userId = session.metadata?.user_id;
        const planId = session.metadata?.plan_id;
        const billingPeriod = session.metadata?.billing_period || "monthly";

        if (userId && planId) {
          // Deactivate existing subscriptions
          await supabase
            .from("subscriptions")
            .update({ status: "canceled", updated_at: new Date().toISOString() })
            .eq("user_id", userId)
            .eq("status", "active");

          // Check if this is a trial subscription
          const isTrial = session.subscription ? false : false; // We'll check from Stripe
          let isTrialSub = false;

          // Fetch the Stripe subscription to check trial status
          if (session.subscription) {
            try {
              const stripeSubRes = await fetch(`https://api.stripe.com/v1/subscriptions/${session.subscription}`, {
                headers: { "Authorization": `Bearer ${STRIPE_SECRET_KEY}` },
              });
              const stripeSub = await stripeSubRes.json();
              isTrialSub = stripeSub.metadata?.is_trial === "true" || !!stripeSub.trial_end;
            } catch (e) {
              console.error("Failed to fetch Stripe subscription:", e);
            }
          }

          const { data: newSub } = await supabase.from("subscriptions").insert({
            user_id: userId,
            plan_id: planId,
            status: "active",
            billing_period: billingPeriod,
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            current_period_start: new Date().toISOString(),
            is_trial: isTrialSub,
          }).select("id").single();

          // Calculate affiliate commissions
          if (newSub) {
            const paymentAmount = (session.amount_total || 0) / 100;
            try {
              await fetch(`${supabaseUrl}/functions/v1/calculate-affiliate-commission`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${supabaseKey}`,
                },
                body: JSON.stringify({
                  retailer_user_id: userId,
                  subscription_id: newSub.id,
                  payment_amount: paymentAmount,
                }),
              });
              console.log("Affiliate commission calculation triggered");
            } catch (commErr) {
              console.error("Failed to calculate affiliate commission:", commErr);
            }
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const subType = subscription.metadata?.type;

        if (subType === "messaging") {
          // Update messaging subscription
          const { error } = await supabase
            .from("messaging_subscriptions")
            .update({
              status: subscription.status === "active" ? "active" : subscription.status,
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscription.id);
          if (error) console.error("Update messaging subscription error:", error);
        } else {
          // Update plan subscription
          const { error } = await supabase
            .from("subscriptions")
            .update({
              status: subscription.status === "active" ? "active" : subscription.status,
              current_period_end: subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000).toISOString()
                : null,
              cancel_at_period_end: subscription.cancel_at_period_end || false,
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscription.id);
          if (error) console.error("Update subscription error:", error);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const subType = subscription.metadata?.type;

        if (subType === "messaging") {
          await supabase
            .from("messaging_subscriptions")
            .update({ status: "canceled", updated_at: new Date().toISOString() })
            .eq("stripe_subscription_id", subscription.id);
        } else {
          await supabase
            .from("subscriptions")
            .update({ status: "canceled", updated_at: new Date().toISOString() })
            .eq("stripe_subscription_id", subscription.id);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        if (invoice.subscription) {
          // Try both tables
          await supabase
            .from("subscriptions")
            .update({ status: "past_due", updated_at: new Date().toISOString() })
            .eq("stripe_subscription_id", invoice.subscription);
          await supabase
            .from("messaging_subscriptions")
            .update({ status: "past_due", updated_at: new Date().toISOString() })
            .eq("stripe_subscription_id", invoice.subscription);
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Errore" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
});

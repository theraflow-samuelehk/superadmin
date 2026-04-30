import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const {
      salonUserId,
      items,
      customerName,
      customerEmail,
      customerPhone,
      successUrl,
      cancelUrl,
      paymentMethod,
      deliveryMethod,
      shippingAddress,
    } = await req.json();

    if (!salonUserId || !items?.length || !customerName) {
      throw new Error("Dati mancanti");
    }

    // --- SERVER-SIDE PRICE VALIDATION ---
    // Extract product IDs from cart items
    const productIds = items.map((i: { id?: string; product_id?: string }) => i.id || i.product_id).filter(Boolean);
    if (productIds.length === 0) {
      throw new Error("Nessun prodotto valido nel carrello");
    }

    // Fetch authoritative prices from DB
    const { data: dbProducts, error: dbError } = await supabase
      .from("products")
      .select("id, name, sale_price, quantity")
      .in("id", productIds)
      .eq("user_id", salonUserId)
      .is("deleted_at", null);

    if (dbError) throw new Error(`Errore recupero prodotti: ${dbError.message}`);
    if (!dbProducts || dbProducts.length === 0) {
      throw new Error("Nessun prodotto trovato");
    }

    // Build a price map from DB
    const priceMap = new Map<string, { name: string; sale_price: number; quantity: number }>();
    for (const p of dbProducts) {
      priceMap.set(p.id, { name: p.name, sale_price: p.sale_price, quantity: p.quantity });
    }

    // Validate and rebuild items with server-side prices
    const validatedItems: Array<{ id: string; name: string; price: number; quantity: number }> = [];
    for (const item of items) {
      const productId = item.id || item.product_id;
      const dbProduct = priceMap.get(productId);
      if (!dbProduct) {
        throw new Error(`Prodotto non trovato o non appartiene a questo negozio: ${productId}`);
      }

      const quantity = Math.max(1, Math.min(Math.floor(Number(item.quantity) || 1), 100));
      if (dbProduct.quantity < quantity) {
        throw new Error(`Quantità insufficiente per "${dbProduct.name}". Disponibili: ${dbProduct.quantity}`);
      }

      validatedItems.push({
        id: productId,
        name: dbProduct.name,
        price: dbProduct.sale_price,
        quantity,
      });
    }

    const subtotal = validatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

    // Get the salon's own Stripe key from shop_settings
    const { data: shopSettings } = await supabase
      .from("shop_settings")
      .select("stripe_secret_key")
      .eq("user_id", salonUserId)
      .maybeSingle();

    const STRIPE_SECRET_KEY = shopSettings?.stripe_secret_key || null;

    // Generate order number
    const { data: orderNum } = await supabase.rpc("generate_order_number", {
      p_user_id: salonUserId,
    });

    // Handle in-store / non-Stripe orders
    if (paymentMethod === "in_store" || paymentMethod !== "stripe") {
      const { data: order, error: orderError } = await supabase
        .from("shop_orders")
        .insert({
          user_id: salonUserId,
          order_number: orderNum || `ORD-${Date.now()}`,
          customer_name: customerName,
          customer_email: customerEmail || null,
          customer_phone: customerPhone || null,
          items: validatedItems,
          subtotal,
          total: subtotal,
          payment_method: "in_store",
          delivery_method: deliveryMethod || "pickup",
          shipping_address: shippingAddress || null,
          status: "new",
        })
        .select("id, order_number")
        .single();

      if (orderError) throw new Error(`Errore creazione ordine: ${orderError.message}`);

      return new Response(
        JSON.stringify({ success: true, orderId: order.id, orderNumber: order.order_number }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Stripe payment flow
    if (!STRIPE_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: "Stripe non configurato. Il negozio deve configurare le chiavi di pagamento." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create order as "pending_payment"
    const { data: order, error: orderError } = await supabase
      .from("shop_orders")
      .insert({
        user_id: salonUserId,
        order_number: orderNum || `ORD-${Date.now()}`,
        customer_name: customerName,
        customer_email: customerEmail || null,
        customer_phone: customerPhone || null,
        items: validatedItems,
        subtotal,
        total: subtotal,
        payment_method: "stripe",
        delivery_method: deliveryMethod || "pickup",
        shipping_address: shippingAddress || null,
        status: "pending_payment",
      })
      .select("id, order_number")
      .single();

    if (orderError) throw new Error(`Errore creazione ordine: ${orderError.message}`);

    // Build Stripe line items using server-validated prices
    const lineItems = validatedItems.map(
      (item, idx) => ({
        [`line_items[${idx}][price_data][currency]`]: "eur",
        [`line_items[${idx}][price_data][product_data][name]`]: item.name,
        [`line_items[${idx}][price_data][unit_amount]`]: Math.round(item.price * 100).toString(),
        [`line_items[${idx}][quantity]`]: item.quantity.toString(),
      })
    );

    const params = new URLSearchParams();
    params.set("mode", "payment");
    params.set("success_url", successUrl || `${req.headers.get("origin") || ""}/shop/${salonUserId.slice(0, 8)}?success=true`);
    params.set("cancel_url", cancelUrl || `${req.headers.get("origin") || ""}/shop/${salonUserId.slice(0, 8)}?canceled=true`);
    params.set("metadata[shop_order_id]", order.id);
    params.set("metadata[salon_user_id]", salonUserId);
    if (customerEmail) {
      params.set("customer_email", customerEmail);
    }

    lineItems.forEach((item: Record<string, string>) => {
      Object.entries(item).forEach(([key, value]) => {
        params.set(key, value);
      });
    });

    const sessionRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });
    const session = await sessionRes.json();
    if (!sessionRes.ok) {
      throw new Error(`Stripe error: ${session.error?.message}`);
    }

    // Save stripe session ID on order
    await supabase
      .from("shop_orders")
      .update({ notes: `stripe_session:${session.id}` })
      .eq("id", order.id);

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id, orderId: order.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Shop checkout error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Errore sconosciuto" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

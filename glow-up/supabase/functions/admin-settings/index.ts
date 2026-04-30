import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const jsonHeaders = {
  ...corsHeaders,
  "Content-Type": "application/json",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: jsonHeaders,
  });
}

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Errore sconosciuto";
}

function normalizeBaileysUrl(serviceUrl: string) {
  const normalized = serviceUrl.trim().replace(/\/$/, "");

  if (!normalized) {
    throw new Error("URL del servizio Baileys mancante");
  }

  if (!/^https?:\/\//i.test(normalized)) {
    throw new Error("URL del servizio Baileys non valido");
  }

  return normalized;
}

async function proxyBaileysRequest({
  serviceUrl,
  apiKey,
  path,
  method = "GET",
  body,
}: {
  serviceUrl: string;
  apiKey?: string;
  path: string;
  method?: "GET" | "POST";
  body?: unknown;
}) {
  const url = `${normalizeBaileysUrl(serviceUrl)}${path}`;
  const headers: Record<string, string> = {};

  if (apiKey) {
    headers["x-api-key"] = apiKey;
  }

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text();

  if (!response.ok) {
    const details = typeof payload === "string" ? payload : JSON.stringify(payload);
    throw new Error(`Errore Baileys ${response.status}: ${details || "richiesta fallita"}`);
  }

  return payload;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new Error("Non autenticato");
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      throw new Error("Non autenticato");
    }

    const userId = claimsData.claims.sub as string;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "super_admin")
      .maybeSingle();

    if (!roleData) throw new Error("Accesso negato: solo super admin");

    const body = await req.json();
    const { action } = body;

    if (action === "delete_auth_user") {
      const { target_user_id } = body;
      if (!target_user_id) throw new Error("target_user_id richiesto");

      const { error: deleteError } = await supabase.auth.admin.deleteUser(target_user_id);
      if (deleteError) throw new Error(`Errore eliminazione utente: ${deleteError.message}`);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "save_stripe_keys") {
      const { stripe_secret_key, stripe_webhook_secret } = body;

      if (stripe_secret_key) {
        await supabase.from("platform_settings").upsert(
          {
            key: "stripe_secret_key",
            value: stripe_secret_key,
            updated_by: userId,
            description: "Stripe Secret Key",
          },
          { onConflict: "key" }
        );
      }

      if (stripe_webhook_secret) {
        await supabase.from("platform_settings").upsert(
          {
            key: "stripe_webhook_secret",
            value: stripe_webhook_secret,
            updated_by: userId,
            description: "Stripe Webhook Secret",
          },
          { onConflict: "key" }
        );
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get_google_maps_settings") {
      const { data: settings, error } = await supabase
        .from("platform_settings")
        .select("key, value")
        .in("key", ["google_maps_api_key", "google_maps_account_email"]);

      if (error) throw error;

      const values = Object.fromEntries((settings || []).map((item) => [item.key, item.value]));

      return new Response(
        JSON.stringify({
          google_maps_api_key: values.google_maps_api_key || "",
          google_maps_account_email: values.google_maps_account_email || "",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "save_google_maps_settings") {
      const { google_maps_api_key, google_maps_account_email } = body;

      if (!google_maps_api_key || !google_maps_api_key.startsWith("AIza")) {
        throw new Error("Google Maps API Key non valida");
      }

      const updates = [
        {
          key: "google_maps_api_key",
          value: google_maps_api_key,
          updated_by: userId,
          description: "Google Maps API Key per Places Autocomplete",
        },
        {
          key: "google_maps_account_email",
          value: google_maps_account_email || "",
          updated_by: userId,
          description: "Account Google Cloud associato a Google Maps API",
        },
      ];

      const { error } = await supabase.from("platform_settings").upsert(updates, { onConflict: "key" });
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "baileys_health") {
      const result = await proxyBaileysRequest({
        serviceUrl: getString(body.service_url),
        apiKey: getString(body.api_key),
        path: "/health",
      });

      return jsonResponse(result);
    }

    if (action === "baileys_qr") {
      const result = await proxyBaileysRequest({
        serviceUrl: getString(body.service_url),
        apiKey: getString(body.api_key),
        path: "/qr",
      });

      return jsonResponse({ html: typeof result === "string" ? result : "" });
    }

    if (action === "baileys_pair") {
      const phone = getString(body.phone);

      if (!phone) {
        throw new Error("Numero di telefono richiesto");
      }

      try {
        const result = await proxyBaileysRequest({
          serviceUrl: getString(body.service_url),
          apiKey: getString(body.api_key),
          path: "/pair",
          method: "POST",
          body: { phone },
        });

        return jsonResponse(result);
      } catch (error) {
        const message = getErrorMessage(error);

        if (message.includes("Cannot POST /pair") || message.includes("Cannot GET /pair")) {
          return jsonResponse({
            success: false,
            code: "pairing_not_supported",
            error: "Questo microservizio non supporta il collegamento con numero. Usa il QR Code oppure aggiorna il deploy del microservizio con l'endpoint /pair.",
          });
        }

        // Return structured error so frontend can handle it gracefully
        return jsonResponse({ success: false, error: message });
      }
    }

    if (action === "baileys_disconnect") {
      const result = await proxyBaileysRequest({
        serviceUrl: getString(body.service_url),
        apiKey: getString(body.api_key),
        path: "/disconnect",
        method: "POST",
        body: {},
      });

      return jsonResponse(result);
    }

    throw new Error("Azione non valida");
  } catch (error) {
    console.error("Admin settings error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Errore sconosciuto" }),
      { status: 400, headers: jsonHeaders }
    );
  }
});
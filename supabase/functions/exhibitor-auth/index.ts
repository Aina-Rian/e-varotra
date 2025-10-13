import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get request body
    const { eventId, token } = await req.json();

    if (!eventId || !token) {
      throw new Error("Missing required parameters");
    }

    // Verify token and get exhibitor access token
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from("exhibitor_access_tokens")
      .select("exhibitor_id")
      .eq("event_id", eventId)
      .eq("token", token)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (tokenError || !tokenData) {
      throw new Error("Invalid or expired access token");
    }

    // Get exhibitor details
    const { data: exhibitor, error: exhibitorError } = await supabaseClient
      .from("exhibitors")
      .select("*")
      .eq("id", tokenData.exhibitor_id)
      .single();

    if (exhibitorError || !exhibitor) {
      throw new Error("Exhibitor not found");
    }

    // Get event exhibitor details
    const { data: eventExhibitor, error: eventExhibitorError } = await supabaseClient
      .from("event_exhibitors")
      .select("*")
      .eq("event_id", eventId)
      .eq("exhibitor_id", tokenData.exhibitor_id)
      .single();

    if (eventExhibitorError || !eventExhibitor) {
      throw new Error("Event exhibitor details not found");
    }

    return new Response(
      JSON.stringify({
        exhibitor,
        eventExhibitor,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 400,
      }
    );
  }
});
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
    const { exhibitorId, eventId, token } = await req.json();

    if (!exhibitorId || !eventId || !token) {
      throw new Error("Missing required parameters: exhibitorId, eventId, and token are required");
    }

    // Verify token and get exhibitor access token
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from("exhibitor_access_tokens")
      .select("*")
      .eq("exhibitor_id", exhibitorId)
      .eq("event_id", eventId)
      .eq("token", token)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (tokenError || !tokenData) {
      throw new Error("Invalid or expired access token");
    }

    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError) {
      throw new Error("Authentication error: " + userError.message);
    }

    // Set custom claim for exhibitor token
    const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
      user?.id || "",
      {
        app_metadata: {
          exhibitor_token: token,
          exhibitor_id: exhibitorId,
          event_id: eventId
        }
      }
    );

    if (updateError) {
      throw new Error("Failed to set exhibitor token: " + updateError.message);
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in set-exhibitor-token function:", error);
    
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
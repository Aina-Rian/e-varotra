import { createClient } from "npm:@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
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
    const { token, sessionId } = await req.json();

    if (!token || !sessionId) {
      return new Response(
        JSON.stringify({
          error: "Missing required parameters: token and sessionId are required"
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

    console.log("Setting speaker token for session:", sessionId);

    // Verify token and get speaker access token
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from("speaker_access_tokens")
      .select("speaker_id, expires_at")
      .eq("session_id", sessionId)
      .eq("token", token)
      .single();

    if (tokenError) {
      console.error("Token verification error:", tokenError);
      return new Response(
        JSON.stringify({
          error: "Invalid access token"
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
          status: 401,
        }
      );
    }

    if (!tokenData) {
      return new Response(
        JSON.stringify({
          error: "Token not found"
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
          status: 404,
        }
      );
    }

    // Check if token has expired
    if (new Date(tokenData.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({
          error: "Token has expired"
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
          status: 401,
        }
      );
    }

    console.log("Found speaker:", tokenData.speaker_id);

    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: "Missing authorization header"
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
          status: 401,
        }
      );
    }

    // Extract JWT token
    const jwt = authHeader.replace('Bearer ', '');

    // Get current user from JWT
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(jwt);

    if (userError || !user) {
      console.error("User verification error:", userError);
      return new Response(
        JSON.stringify({
          error: "Authentication error: " + (userError?.message || "User not found")
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
          status: 401,
        }
      );
    }

    console.log("Updating user claims for:", user.id);

    // Set custom claims for speaker token
    const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
      user.id,
      {
        app_metadata: {
          speaker_token: token,
          session_id: sessionId,
          speaker_id: tokenData.speaker_id,
          role: "speaker"
        }
      }
    );

    if (updateError) {
      console.error("Update user claims error:", updateError);
      return new Response(
        JSON.stringify({
          error: "Failed to set speaker token: " + updateError.message
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
          status: 500,
        }
      );
    }

    console.log("Successfully updated user claims");

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Speaker token set successfully"
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
    console.error("Error in set-speaker-token function:", error);
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "An unexpected error occurred"
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 500,
      }
    );
  }
});
import { createClient } from "npm:@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
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
    // Get the token and session ID from the request
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const sessionId = url.searchParams.get("sessionId");

    if (!token || !sessionId) {
      return new Response(
        JSON.stringify({ error: "Token and sessionId are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Authenticating speaker with token:", token, "and sessionId:", sessionId);

    // Initialize Supabase client with service role key for admin access
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Validate the token and get the speaker
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from("speaker_access_tokens")
      .select("speaker_id, session_id")
      .eq("token", token)
      .eq("session_id", sessionId)
      .single();

    if (tokenError || !tokenData) {
      console.error("Token validation error:", tokenError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Token validated, found speaker:", tokenData.speaker_id);

    // Get the speaker details
    const { data: speakerData, error: speakerError } = await supabaseAdmin
      .from("speakers")
      .select("user_id, email, full_name")
      .eq("id", tokenData.speaker_id)
      .single();

    if (speakerError || !speakerData || !speakerData.user_id) {
      console.error("Speaker lookup error:", speakerError);
      return new Response(
        JSON.stringify({ error: "Speaker not found or has no user account" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Found speaker data:", speakerData.full_name);

    // Try to get the user's email from the public users table first
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("email")
      .eq("id", speakerData.user_id)
      .single();

    let userEmail = userData?.email || speakerData.email;

    // If email not found in public users table, try to get it from auth.users
    if (!userEmail) {
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(
        speakerData.user_id
      );

      if (authError) {
        console.error("Auth user lookup error:", authError);
        return new Response(
          JSON.stringify({ error: "Failed to retrieve user information", details: authError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      userEmail = authUser.user?.email;
    }

    if (!userEmail) {
      console.error("No email found for user");
      return new Response(
        JSON.stringify({ error: "User email not found in any table" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Found user email:", userEmail);

    // Generate a temporary password for sign-in
    const tempPassword = crypto.randomUUID();

    // Update the user's password and set custom claims
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      speakerData.user_id,
      { 
        password: tempPassword,
        app_metadata: {
          speaker_token: token,
          session_id: sessionId,
          speaker_id: tokenData.speaker_id,
          role: "speaker"
        }
      }
    );

    if (updateError) {
      console.error("User update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update user", details: updateError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Updated user with temporary password and claims");

    // Sign in with the temporary password
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: userEmail,
      password: tempPassword,
    });

    if (signInError) {
      console.error("Sign in error:", signInError);
      return new Response(
        JSON.stringify({ error: "Failed to sign in", details: signInError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Successfully signed in speaker");

    return new Response(
      JSON.stringify({
        session: signInData.session,
        user: signInData.user,
        speaker: {
          id: tokenData.speaker_id,
          name: speakerData.full_name,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in speaker-auth function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
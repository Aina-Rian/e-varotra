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

    // Validate the token and get the moderator
    // In a real implementation, you would have a moderator_access_tokens table
    // For now, we'll use a simple validation
    if (token !== "59b938c5410c4ffa8a488a61a708523d") {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get the session details
    const { data: sessionData, error: sessionError } = await supabaseAdmin
      .from("sessions")
      .select("*, event:event_id(organizer_id)")
      .eq("id", sessionId)
      .single();

    if (sessionError || !sessionData) {
      return new Response(
        JSON.stringify({ error: "Session not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get the organizer's user ID
    const organizerId = sessionData.event.organizer_id;

    // Get the organizer's user details
    const { data: organizerData, error: organizerError } = await supabaseAdmin
      .from("users")
      .select("id, email, full_name, role")
      .eq("id", organizerId)
      .single();

    if (organizerError || !organizerData) {
      return new Response(
        JSON.stringify({ error: "Organizer not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if the user is a moderator
    if (organizerData.role !== 'moderator') {
      return new Response(
        JSON.stringify({ error: "User is not a moderator" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Generate a temporary password for sign-in
    const tempPassword = crypto.randomUUID();

    // Update the user's password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      organizerId,
      { password: tempPassword }
    );

    if (updateError) {
      return new Response(
        JSON.stringify({ error: "Failed to update user password", details: updateError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Sign in with the temporary password
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: organizerData.email,
      password: tempPassword,
    });

    if (signInError) {
      return new Response(
        JSON.stringify({ error: "Failed to sign in", details: signInError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        session: signInData.session,
        user: signInData.user,
        moderator: {
          id: organizerData.id,
          name: organizerData.full_name,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in moderator-auth function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
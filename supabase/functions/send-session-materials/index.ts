import { createClient } from "npm:@supabase/supabase-js@2.38.4";
import nodemailer from 'npm:nodemailer@6.9.10';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

Deno.serve(async (req)=>{
		
	if (req.method === 'OPTIONS') {
		return new Response(null, {
			headers: corsHeaders,
			status: 204
		});
	}
		
	const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", {
		auth: {
			autoRefreshToken: false,
			persistSession: false
		}
	});

	try {
		const requiredEnvVars = [
      'SMTP_HOST',
      'SMTP_PORT',
      'SMTP_USER',
      'SMTP_PASS',
      'SITE_URL'
    ];

    for (const envVar of requiredEnvVars) {
      if (!Deno.env.get(envVar)) {
        throw new Error(`Missing required environment variable: ${envVar}`);
      }
    }

		const transport = nodemailer.createTransport({
			host: Deno.env.get('SMTP_HOST'),
			port: Number(Deno.env.get('SMTP_PORT')),
			auth: {
				user: Deno.env.get('SMTP_USER'),
				pass: Deno.env.get('SMTP_PASS')
			}
		});

		const { name, email, eventTitle, session_id } = await req.json();
		if (!name || !email || !session_id) {
      return new Response(JSON.stringify({
        error: 'Missing required fields'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      });
    }

    const { data: session, error: sessionError } = await supabaseClient
      .from("sessions")
      .select("*")
      .eq("id", session_id)
      .single();

  
    if (sessionError || !session) {
      throw new Error("Invalid session_Id");
    }

		const { data: materials, error: materialsError } = await supabaseClient
      .from("session_materials")
      .select("*")
      .eq("id", session_id)
  
    if (materialsError || !materials) {
      throw new Error("Invalid session_Id");
    }
    
    const attachments = materials.map((material: any) => ({
      filename: material.title,
      path: material.url,
    }));

		const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Vibee's!</h2>
        <p>Hello ${name},</p>
        <p>The Session "${session.title}" of "${eventTitle}" you registered for ended.</p>
        <p>You can find the shared materials below</p>
        ${attachments.map((attachment: any) => `
          <a href="${attachment.path}" style="display: block; margin: 10px 0; padding: 10px; background: #f3f4f6; border-radius: 8px; text-decoration: none; color: #374151;">
            ${attachment.filename}
          </a>
        `).join('')}
        <p>Thank you for attending the session.</p>
        <p>Best regards,</p>
        <p>Vibee's</p>
      </div>
    `;

		try {
			await new Promise((resolve, reject)=>{
				transport.sendMail({
					from: '"Vibee\'s Events" <noreply@vibees.net>',
					to: email,
					subject: `Shared Media: ${eventTitle}`,
					html: html
				}, (error)=>{
					if (error) {
						return reject(error);
					}
					resolve();
				});
			});
			return new Response(JSON.stringify({
        success: true
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      });
		} catch (emailError) {
			console.error('Error sending email:', emailError);
      throw new Error(`Failed to send email: ${emailError.message}`);
		}	
	}catch (error) {
		console.error('Error in speaker invitation function:', error);
    return new Response(JSON.stringify({
      error: 'Failed to send invitation email',
      details: error.message
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
	}
});

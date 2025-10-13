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
      'SMTP_SECURE',
      'VITE_APP_URL'
    ];

    for (const envVar of requiredEnvVars) {
      if (!Deno.env.get(envVar)) {
        throw new Error(`Missing required environment variable: ${envVar}`);
      }
    }

		const transport = nodemailer.createTransport({
			host: Deno.env.get('SMTP_HOST'),
			port: Number(Deno.env.get('SMTP_PORT')),
			secure: Boolean(Deno.env.get('SMTP_SECURE')),
			auth: {
				user: Deno.env.get('SMTP_USER'),
				pass: Deno.env.get('SMTP_PASS')
			}
		});

		const { exhibitor_id, event_id, eventTitle, startTime, endTime } = await req.json();
		if (!exhibitor_id || !event_id || !eventTitle || !startTime || !endTime) {
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

		const { data: exhibitor, error: tokenError } = await supabaseClient
      .from("exhibitors")
      .select("*")
      .eq("id", exhibitor_id)
      .single();
  
    if (tokenError || !exhibitor) {
      throw new Error("Invalid Exhibitor_Id");
    }

		const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Vibee's!</h2>
        <p>Hello ${exhibitor.company_name},</p>
        <p>You have been invited as an exhibitor for the event "${eventTitle}".</p>
                        
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Session Details:</strong></p>
          <p style="margin: 10px 0;">Start: ${new Date(startTime).toLocaleString()}</p>
          <p style="margin: 10px 0;">End: ${new Date(endTime).toLocaleString()}</p>
        </div>
    
        <div style="text-align: center; margin: 30px 0;">
          <a href="${Deno.env.get('VITE_APP_URL')}${exhibitor.access_link}" style="background: #4F46E5; color: white; padding: 12px 24px; 
              text-decoration: none; border-radius: 6px; display: inline-block;">
            Prepare My Stand
          </a>
        </div>
    
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Before the session:</strong></p>
          <ul style="margin: 10px 0;">
            <li>Upload your presentation materials</li>
            <li>Test your audio and video</li>
            <li>Review any pre-submitted questions</li>
          </ul>
        </div>
    
        <p style="color: #6B7280; font-size: 14px;">
          This link is unique to you and will expire in 7 days. Please do not share it with others.
        </p>
      </div>
    `;

		try {
			await new Promise((resolve, reject)=>{
				transport.sendMail({
					from: '"Vibee\'s Events" <vibees@leadsync.fr>',
					to: exhibitor.contact_email,
					subject: `Exhibitor Invitation: ${eventTitle}`,
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

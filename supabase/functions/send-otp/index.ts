import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface SendOtpRequest {
  email: string;
  name?: string;
  password?: string;
  type: 'signup' | 'resend' | 'forgot-password';
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, name, password, type } = await req.json() as SendOtpRequest;

    if (!email) {
      throw new Error('Email is required');
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if email is already registered and verified
    if (type === 'signup') {
      const { data: existingUser } = await supabase.auth.admin.listUsers();
      const userExists = existingUser?.users?.find(u => u.email === email);
      
      if (userExists) {
        // Check if user is verified
        const { data: profile } = await supabase
          .from('profiles')
          .select('email_verified')
          .eq('id', userExists.id)
          .single();
        
        if (profile?.email_verified) {
          return new Response(
            JSON.stringify({ error: 'Email is already registered. Please sign in.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Create user if not exists (for signup)
      if (!userExists && password) {
        const { error: signUpError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: false,
          user_metadata: { name: name || email }
        });

        if (signUpError && !signUpError.message.includes('already been registered')) {
          throw signUpError;
        }
      }
    }

    // For forgot-password, verify user exists
    if (type === 'forgot-password') {
      const { data: existingUser } = await supabase.auth.admin.listUsers();
      const userExists = existingUser?.users?.find(u => u.email === email);
      
      if (!userExists) {
        return new Response(
          JSON.stringify({ error: 'No account found with this email.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Invalidate any existing unused OTPs for this email
    await supabase
      .from('otp_verifications')
      .update({ is_used: true })
      .eq('email', email)
      .eq('is_used', false);

    // Generate new OTP
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store OTP
    const { error: insertError } = await supabase
      .from('otp_verifications')
      .insert({
        email,
        otp_code: otpCode,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error('Error storing OTP:', insertError);
      throw new Error('Failed to generate OTP');
    }

    // Send email via SMTP
    const smtpHost = Deno.env.get('SMTP_HOST')!;
    const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '587');
    const smtpUser = Deno.env.get('SMTP_USER')!;
    const smtpPass = Deno.env.get('SMTP_PASS')!;
    const smtpFrom = Deno.env.get('SMTP_FROM')!;

    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: smtpPort,
        tls: true,
        auth: {
          username: smtpUser,
          password: smtpPass,
        },
      },
    });

    const isPasswordReset = type === 'forgot-password';
    const emailSubject = isPasswordReset ? 'Reset Your TabletKart Password' : 'Your TabletKart Verification Code';
    const emailHeading = isPasswordReset ? 'Reset Your Password' : 'Verify Your Email';
    const emailDescription = isPasswordReset 
      ? 'Use the following code to reset your password:'
      : 'Use the following code to verify your email address:';

    await client.send({
      from: smtpFrom,
      to: email,
      subject: emailSubject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #7C3AED; margin: 0;">
              <span style="color: #7C3AED;">tablet</span><span style="color: #22C55E;">kart</span><span style="color: #7C3AED;">.in</span>
            </h1>
          </div>
          <h2 style="color: #333; text-align: center;">${emailHeading}</h2>
          <p style="color: #666; text-align: center; font-size: 16px;">
            ${emailDescription}
          </p>
          <div style="background: linear-gradient(135deg, #7C3AED 0%, #9333EA 100%); border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
            <span style="font-size: 36px; font-weight: bold; color: white; letter-spacing: 8px;">${otpCode}</span>
          </div>
          <p style="color: #999; text-align: center; font-size: 14px;">
            This code will expire in <strong>5 minutes</strong>.
          </p>
          <p style="color: #999; text-align: center; font-size: 12px; margin-top: 30px;">
            If you didn't request this code, please ignore this email.
          </p>
        </div>
      `,
    });

    await client.close();

    console.log(`OTP sent successfully to ${email}`);

    return new Response(
      JSON.stringify({ success: true, message: 'OTP sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in send-otp:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to send OTP' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

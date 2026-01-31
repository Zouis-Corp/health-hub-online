import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

type NotificationType = 'rx-uploaded' | 'rx-approved' | 'rx-rejected' | 'order-confirmed' | 'payment-received' | 'payment-failed' | 'status-update';

interface SendNotificationRequest {
  type: NotificationType;
  userId: string;
  orderId?: string;
  orderNumber?: number;
  notes?: string;
  productNames?: string[];
  totalAmount?: number;
  newStatus?: string;
}

const getEmailContent = (
  type: NotificationType, 
  userName: string, 
  orderNumber?: number,
  notes?: string,
  productNames?: string[],
  totalAmount?: number,
  newStatus?: string
) => {
  const orderDisplay = orderNumber ? `#${orderNumber}` : 'N/A';
  const productListHtml = productNames && productNames.length > 0 
    ? `
      <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: left;">
        <p style="font-weight: bold; margin: 0 0 12px 0; color: #333;">Your Prescribed Items:</p>
        <ul style="margin: 0; padding-left: 20px; color: #555;">
          ${productNames.map(name => `<li style="margin-bottom: 6px;">${name}</li>`).join('')}
        </ul>
        ${totalAmount ? `<p style="font-weight: bold; margin-top: 12px; padding-top: 12px; border-top: 1px solid #e2e8f0; color: #7C3AED;">Total Amount: ₹${totalAmount.toLocaleString()}</p>` : ''}
      </div>
    `
    : '';

  const statusMessages: Record<string, string> = {
    processing: 'Your order is now being processed and will be shipped soon.',
    shipped: 'Great news! Your order has been shipped and is on its way to you.',
    delivered: 'Your order has been delivered. Thank you for choosing TabletKart!',
  };

  const templates: Record<NotificationType, { subject: string; heading: string; message: string; color: string }> = {
    'rx-uploaded': {
      subject: 'Prescription Received - TabletKart',
      heading: 'Prescription Received!',
      message: `
        <p>Thank you for uploading your prescription. Our pharmacist will review it shortly.</p>
        <p>We'll notify you once your prescription is approved and your order is ready for payment.</p>
        <p><strong>What happens next?</strong></p>
        <ul style="text-align: left; display: inline-block;">
          <li>Our expert pharmacist reviews your prescription</li>
          <li>We'll add the medicines to your order</li>
          <li>You'll receive an email with payment details</li>
          <li>Complete payment to receive your medicines</li>
        </ul>
      `,
      color: '#7C3AED',
    },
    'rx-approved': {
      subject: 'Prescription Approved - Complete Your Payment - TabletKart',
      heading: 'Prescription Approved! ✓',
      message: `
        <p>Great news! Your prescription has been reviewed and approved by our pharmacist.</p>
        <p>Your order <strong>${orderDisplay}</strong> is now ready for payment.</p>
        ${productListHtml}
        ${notes ? `<p style="background: #f3f4f6; padding: 12px; border-radius: 8px; margin-top: 16px;"><strong>Note from pharmacist:</strong> ${notes}</p>` : ''}
        <p style="margin-top: 20px;"><strong>Next Step:</strong> Please visit your dashboard to complete the payment and we'll ship your medicines right away!</p>
      `,
      color: '#22C55E',
    },
    'rx-rejected': {
      subject: 'Prescription Review Update - TabletKart',
      heading: 'Prescription Update',
      message: `
        <p>We've reviewed your prescription for order <strong>${orderDisplay}</strong>.</p>
        <p>Unfortunately, we were unable to approve it at this time.</p>
        ${notes ? `<p style="background: #fef2f2; padding: 12px; border-radius: 8px; margin-top: 16px; border-left: 4px solid #EF4444;"><strong>Reason:</strong> ${notes}</p>` : ''}
        <p style="margin-top: 16px;">Please upload a new prescription from your dashboard or contact our support team for assistance.</p>
        <p><strong>Call us:</strong> +91 98948 18002</p>
      `,
      color: '#EF4444',
    },
    'order-confirmed': {
      subject: 'Order Confirmed - TabletKart',
      heading: 'Order Confirmed! 🎉',
      message: `
        <p>Thank you for your order! Your order <strong>${orderDisplay}</strong> has been confirmed.</p>
        <p>We're processing your order and will ship it soon.</p>
        ${productListHtml}
        <p><strong>What happens next?</strong></p>
        <ul style="text-align: left; display: inline-block;">
          <li>Your order is being prepared</li>
          <li>We'll notify you when it ships</li>
          <li>Track your delivery in your dashboard</li>
        </ul>
      `,
      color: '#7C3AED',
    },
    'payment-received': {
      subject: 'Payment Received - Order Processing - TabletKart',
      heading: 'Payment Successful! 💰',
      message: `
        <p>We've received your payment for order <strong>${orderDisplay}</strong>.</p>
        ${productListHtml}
        <p><strong>What happens next?</strong></p>
        <ul style="text-align: left; display: inline-block;">
          <li>Your order is now being processed</li>
          <li>Our team will pack your medicines carefully</li>
          <li>You'll receive shipping updates via email</li>
        </ul>
        <p style="margin-top: 16px;">Thank you for choosing TabletKart!</p>
      `,
      color: '#22C55E',
    },
    'payment-failed': {
      subject: 'Payment Failed - TabletKart',
      heading: 'Payment Failed ❌',
      message: `
        <p>Unfortunately, the payment for your order <strong>${orderDisplay}</strong> could not be processed.</p>
        ${productListHtml}
        <p><strong>What you can do:</strong></p>
        <ul style="text-align: left; display: inline-block;">
          <li>Check your payment method and try again</li>
          <li>Ensure sufficient balance in your account</li>
          <li>Try a different payment method</li>
          <li>Contact your bank if the issue persists</li>
        </ul>
        <p style="margin-top: 16px;">Your order is still saved - visit your dashboard to retry payment.</p>
        <p><strong>Need help?</strong> Call us at +91 98948 18002</p>
      `,
      color: '#EF4444',
    },
    'status-update': {
      subject: `Order ${newStatus ? newStatus.charAt(0).toUpperCase() + newStatus.slice(1) : 'Update'} - TabletKart`,
      heading: `Order ${newStatus ? newStatus.charAt(0).toUpperCase() + newStatus.slice(1) : 'Updated'}!`,
      message: `
        <p>Your order <strong>${orderDisplay}</strong> has been updated.</p>
        <p>${statusMessages[newStatus || ''] || 'Your order status has been updated.'}</p>
        ${productListHtml}
        <p style="margin-top: 16px;">Track your order in your dashboard.</p>
      `,
      color: newStatus === 'delivered' ? '#22C55E' : '#7C3AED',
    },
  };

  const template = templates[type];
  
  return {
    subject: template.subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="margin: 0;">
            <span style="color: #7C3AED;">tablet</span><span style="color: #22C55E;">kart</span><span style="color: #7C3AED;">.in</span>
          </h1>
        </div>
        
        <div style="background: ${template.color}; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <h2 style="color: white; margin: 0; font-size: 24px;">${template.heading}</h2>
        </div>
        
        <div style="color: #333; font-size: 16px; line-height: 1.6; text-align: center;">
          <p style="margin-bottom: 8px;">Hi <strong>${userName}</strong>,</p>
          ${template.message}
        </div>
        
        <div style="margin-top: 32px; text-align: center;">
          <a href="https://tabletkart.in/dashboard" 
             style="display: inline-block; background: ${template.color}; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            ${type === 'rx-approved' ? 'Complete Payment' : 'View Dashboard'}
          </a>
        </div>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px;">
          <p>Need help? Contact us at +91 98948 18002</p>
          <p>© ${new Date().getFullYear()} TabletKart. All rights reserved.</p>
        </div>
      </div>
    `,
  };
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { type, userId, orderId, orderNumber, notes, productNames, totalAmount, newStatus } = await req.json() as SendNotificationRequest;

    console.log(`[send-notification-email] Received request: type=${type}, userId=${userId}, orderId=${orderId}, orderNumber=${orderNumber}`);

    if (!type || !userId) {
      throw new Error('Missing required fields: type and userId');
    }

    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user profile and email
    const { data: userData } = await supabase.auth.admin.getUserById(userId);
    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', userId)
      .single();

    const userEmail = userData?.user?.email;
    const userName = profile?.name || userEmail?.split('@')[0] || 'Customer';

    console.log(`[send-notification-email] User: ${userName}, Email: ${userEmail}`);

    if (!userEmail) {
      console.log('[send-notification-email] No email found for user:', userId);
      return new Response(
        JSON.stringify({ success: false, message: 'User email not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get order items and order number if not provided and orderId exists
    let items = productNames;
    let total = totalAmount;
    let orderNum = orderNumber;
    
    if (orderId) {
      // Fetch order number if not provided
      if (!orderNum) {
        const { data: orderData } = await supabase
          .from('orders')
          .select('order_number')
          .eq('id', orderId)
          .single();
        orderNum = orderData?.order_number;
        console.log(`[send-notification-email] Fetched order_number: ${orderNum}`);
      }

      // Fetch order items if not provided
      if (!items) {
        console.log('[send-notification-email] Fetching order items for order:', orderId);
        const { data: orderItems } = await supabase
          .from('order_items')
          .select('quantity, price, medicines(name)')
          .eq('order_id', orderId);
        
        if (orderItems && orderItems.length > 0) {
          items = orderItems.map((item: any) => `${item.medicines?.name} x${item.quantity}`);
          total = orderItems.reduce((sum: number, item: any) => sum + (Number(item.price) * Number(item.quantity)), 0);
        }
        console.log(`[send-notification-email] Found ${items?.length || 0} items, total: ₹${total}`);
      }
    }

    // Get email content
    const emailContent = getEmailContent(type, userName, orderNum, notes, items, total, newStatus);

    // Send email via SMTP
    const smtpHost = Deno.env.get('SMTP_HOST')!;
    const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '587');
    const smtpUser = Deno.env.get('SMTP_USER')!;
    const smtpPass = Deno.env.get('SMTP_PASS')!;
    const smtpFrom = Deno.env.get('SMTP_FROM')!;

    console.log(`[send-notification-email] Sending email to ${userEmail} via ${smtpHost}:${smtpPort}`);

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

    await client.send({
      from: smtpFrom,
      to: userEmail,
      subject: emailContent.subject,
      content: "Please view this email in an HTML-compatible email client.",
      html: emailContent.html.replace(/\s+/g, ' ').trim(),
    });

    await client.close();

    console.log(`[send-notification-email] Successfully sent [${type}] email to ${userEmail}`);

    return new Response(
      JSON.stringify({ success: true, message: 'Notification sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[send-notification-email] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to send notification' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface CreateOrderRequest {
  action: 'create-order';
  orderId: string;
  amount: number;
  currency?: string;
}

interface VerifyPaymentRequest {
  action: 'verify-payment';
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

interface PaymentFailedRequest {
  action: 'payment-failed';
  orderId: string;
  errorMessage?: string;
}

type RequestBody = CreateOrderRequest | VerifyPaymentRequest | PaymentFailedRequest;

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID');
    const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!RAZORPAY_KEY_ID) {
      throw new Error('RAZORPAY_KEY_ID is not configured');
    }
    if (!RAZORPAY_KEY_SECRET) {
      throw new Error('RAZORPAY_KEY_SECRET is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: RequestBody = await req.json();
    console.log(`[razorpay-payment] Action: ${body.action}`);

    if (body.action === 'create-order') {
      // Create Razorpay order
      const { orderId, amount, currency = 'INR' } = body;

      if (!orderId || !amount) {
        throw new Error('Missing required fields: orderId and amount');
      }

      // Verify order exists in database
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('id, total_amount, status, user_id')
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        throw new Error('Order not found');
      }

      if (order.status !== 'approved') {
        throw new Error('Order is not approved for payment');
      }

      // Get user details
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, phone')
        .eq('id', order.user_id)
        .single();

      const { data: userData } = await supabase.auth.admin.getUserById(order.user_id);
      const userEmail = userData?.user?.email;

      // Create Razorpay order - use btoa for base64 encoding
      const credentials = `${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`;
      const authHeader = `Basic ${btoa(credentials)}`;
      
      const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Razorpay expects amount in paise
          currency,
          receipt: orderId.slice(0, 40), // Razorpay has 40 char limit
          notes: {
            order_id: orderId,
          },
        }),
      });

      const razorpayOrder = await razorpayResponse.json();
      
      if (!razorpayResponse.ok) {
        console.error('[razorpay-payment] Razorpay error:', razorpayOrder);
        throw new Error(`Razorpay error: ${razorpayOrder.error?.description || 'Failed to create order'}`);
      }

      console.log(`[razorpay-payment] Created Razorpay order: ${razorpayOrder.id}`);

      return new Response(
        JSON.stringify({
          success: true,
          razorpayOrderId: razorpayOrder.id,
          razorpayKeyId: RAZORPAY_KEY_ID,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          prefill: {
            name: profile?.name || '',
            email: userEmail || '',
            contact: profile?.phone || '',
          },
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } else if (body.action === 'verify-payment') {
      // Verify Razorpay payment signature
      const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;

      if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        throw new Error('Missing required payment verification fields');
      }

      // Verify signature
      const message = `${razorpayOrderId}|${razorpayPaymentId}`;
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(RAZORPAY_KEY_SECRET),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
      const expectedSignature = Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      if (expectedSignature !== razorpaySignature) {
        console.error('[razorpay-payment] Invalid signature');
        throw new Error('Invalid payment signature');
      }

      console.log(`[razorpay-payment] Payment verified for order: ${orderId}`);

      // Get order user_id for email
      const { data: order } = await supabase
        .from('orders')
        .select('user_id, total_amount')
        .eq('id', orderId)
        .single();

      // Update order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'processing',
          notes: `Razorpay Payment ID: ${razorpayPaymentId}`,
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('[razorpay-payment] Failed to update order:', updateError);
        throw new Error('Failed to update order status');
      }

      // Send confirmation email
      if (order) {
        try {
          await supabase.functions.invoke('send-notification-email', {
            body: {
              type: 'payment-received',
              userId: order.user_id,
              orderId: orderId,
            },
          });
          console.log('[razorpay-payment] Confirmation email sent');
        } catch (emailError) {
          console.error('[razorpay-payment] Failed to send email:', emailError);
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Payment verified successfully' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } else if (body.action === 'payment-failed') {
      // Handle payment failure
      const { orderId, errorMessage } = body;

      if (!orderId) {
        throw new Error('Missing required field: orderId');
      }

      console.log(`[razorpay-payment] Payment failed for order: ${orderId}, reason: ${errorMessage}`);

      // Get order user_id for email
      const { data: order } = await supabase
        .from('orders')
        .select('user_id')
        .eq('id', orderId)
        .single();

      // Update order payment status to failed
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: 'failed',
          notes: `Payment failed: ${errorMessage || 'Unknown error'}`,
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('[razorpay-payment] Failed to update order:', updateError);
      }

      // Send payment failed email
      if (order) {
        try {
          await supabase.functions.invoke('send-notification-email', {
            body: {
              type: 'payment-failed',
              userId: order.user_id,
              orderId: orderId,
            },
          });
          console.log('[razorpay-payment] Payment failed email sent');
        } catch (emailError) {
          console.error('[razorpay-payment] Failed to send email:', emailError);
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Payment failure recorded' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } else {
      throw new Error('Invalid action');
    }

  } catch (error: any) {
    console.error('[razorpay-payment] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Payment processing failed' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

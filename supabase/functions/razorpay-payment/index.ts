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

// Non-blocking email sender - fire and forget
function sendEmailAsync(
  supabase: any,
  type: string,
  userId: string,
  orderId: string
) {
  // Don't await - let it run in background
  supabase.functions.invoke('send-notification-email', {
    body: { type, userId, orderId },
  }).then(() => {
    console.log(`[razorpay-payment] ${type} email sent for order: ${orderId}`);
  }).catch((emailError: any) => {
    console.error(`[razorpay-payment] Failed to send ${type} email:`, emailError);
  });
}

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

      // Verify order exists
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

      // Fetch profile and user email in parallel for speed
      const [profileData, userData] = await Promise.all([
        supabase
          .from('profiles')
          .select('name, phone')
          .eq('id', order.user_id)
          .single(),
        supabase.auth.admin.getUserById(order.user_id),
      ]);

      const profile = profileData.data;
      const userEmail = userData.data?.user?.email;

      // Create Razorpay order
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

      // Verify signature first (fast cryptographic operation)
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

      // Update order status immediately - this is the critical path
      const { data: updatedOrder, error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'processing',
          notes: `Razorpay Payment ID: ${razorpayPaymentId}`,
        })
        .eq('id', orderId)
        .select('user_id')
        .single();

      if (updateError) {
        console.error('[razorpay-payment] Failed to update order:', updateError);
        throw new Error('Failed to update order status');
      }

      // Fire email in background - don't wait for it
      if (updatedOrder?.user_id) {
        sendEmailAsync(supabase, 'payment-received', updatedOrder.user_id, orderId);
      }

      // Return success immediately
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

      // Update order status immediately
      const { data: updatedOrder, error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: 'failed',
          notes: `Payment failed: ${errorMessage || 'Unknown error'}`,
        })
        .eq('id', orderId)
        .select('user_id')
        .single();

      if (updateError) {
        console.error('[razorpay-payment] Failed to update order:', updateError);
      }

      // Fire email in background - don't wait for it
      if (updatedOrder?.user_id) {
        sendEmailAsync(supabase, 'payment-failed', updatedOrder.user_id, orderId);
      }

      // Return success immediately
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

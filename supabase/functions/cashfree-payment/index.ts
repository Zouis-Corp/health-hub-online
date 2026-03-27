import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const CASHFREE_APP_ID = Deno.env.get('CASHFREE_APP_ID');
    const CASHFREE_SECRET_KEY = Deno.env.get('CASHFREE_SECRET_KEY');
    const CASHFREE_ENV = Deno.env.get('CASHFREE_ENV') || 'PROD'; // 'TEST' or 'PROD'

    if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
      throw new Error('Cashfree credentials not configured');
    }

    const CASHFREE_BASE_URL = CASHFREE_ENV === 'TEST'
      ? 'https://sandbox.cashfree.com/pg'
      : 'https://api.cashfree.com/pg';

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    console.log(`[cashfree-payment] Action: ${body.action}`);

    if (body.action === 'create-order') {
      const { orderId, amount } = body;

      if (!orderId || !amount) {
        throw new Error('Missing required fields: orderId and amount');
      }

      // Fetch the order with user details
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('id, total_amount, status, user_id')
        .eq('id', orderId)
        .single();

      if (orderError || !order) throw new Error('Order not found');
      if (order.status !== 'approved') throw new Error('Order is not approved for payment');

      // Fetch profile and email in parallel
      const [profileData, userData] = await Promise.all([
        supabase.from('profiles').select('name, phone').eq('id', order.user_id).single(),
        supabase.auth.admin.getUserById(order.user_id),
      ]);

      const profile = profileData.data;
      const userEmail = userData.data?.user?.email || 'customer@tabletkart.in';
      const customerPhone = profile?.phone || '9999999999';
      const customerName = profile?.name || 'Customer';

      // Create Cashfree order
      const cashfreePayload = {
        order_id: `TK_${orderId.slice(0, 20)}`,
        order_amount: amount,
        order_currency: 'INR',
        customer_details: {
          customer_id: order.user_id,
          customer_name: customerName,
          customer_email: userEmail,
          customer_phone: customerPhone,
        },
        order_meta: {
          return_url: `${Deno.env.get('APP_URL') || 'https://tabletkart.in'}/dashboard?order=${orderId}`,
          notify_url: `${supabaseUrl}/functions/v1/cashfree-payment`,
        },
        order_note: `TabletKart Order #${orderId.slice(0, 8).toUpperCase()}`,
      };

      const cfResponse = await fetch(`${CASHFREE_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'x-client-id': CASHFREE_APP_ID,
          'x-client-secret': CASHFREE_SECRET_KEY,
          'x-api-version': '2023-08-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cashfreePayload),
      });

      const cfOrder = await cfResponse.json();

      if (!cfResponse.ok) {
        console.error('[cashfree-payment] Cashfree error:', cfOrder);
        throw new Error(`Cashfree error: ${cfOrder.message || 'Failed to create order'}`);
      }

      console.log(`[cashfree-payment] Created Cashfree order: ${cfOrder.order_id}`);

      return new Response(
        JSON.stringify({
          success: true,
          cfOrderId: cfOrder.order_id,
          cfPaymentSessionId: cfOrder.payment_session_id,
          cashfreeAppId: CASHFREE_APP_ID,
          cashfreeEnv: CASHFREE_ENV,
          amount: cfOrder.order_amount,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (body.action === 'verify-payment') {
      const { orderId, cfOrderId } = body;

      if (!orderId || !cfOrderId) {
        throw new Error('Missing required fields: orderId, cfOrderId');
      }

      // Verify with Cashfree API
      const verifyRes = await fetch(`${CASHFREE_BASE_URL}/orders/${cfOrderId}`, {
        method: 'GET',
        headers: {
          'x-client-id': CASHFREE_APP_ID,
          'x-client-secret': CASHFREE_SECRET_KEY,
          'x-api-version': '2023-08-01',
        },
      });

      const cfOrderData = await verifyRes.json();

      if (!verifyRes.ok) {
        throw new Error(`Cashfree verification error: ${cfOrderData.message || 'Failed to verify'}`);
      }

      const orderStatus = cfOrderData.order_status;
      console.log(`[cashfree-payment] Cashfree order ${cfOrderId} status: ${orderStatus}`);

      if (orderStatus === 'PAID') {
        // Update our order
        const { data: updatedOrder, error: updateError } = await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            status: 'processing',
            notes: `Cashfree Order ID: ${cfOrderId}`,
          })
          .eq('id', orderId)
          .select('user_id')
          .single();

        if (updateError) throw new Error('Failed to update order status');

        // Fire email notification in background
        if (updatedOrder?.user_id) {
          supabase.functions.invoke('send-notification-email', {
            body: { type: 'payment-received', userId: updatedOrder.user_id, orderId },
          }).catch(console.error);
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Payment verified successfully' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        // Mark as failed
        await supabase
          .from('orders')
          .update({ payment_status: 'failed', notes: `Cashfree status: ${orderStatus}` })
          .eq('id', orderId);

        throw new Error(`Payment not completed. Status: ${orderStatus}`);
      }

    } else if (body.action === 'payment-failed') {
      const { orderId, errorMessage } = body;
      if (!orderId) throw new Error('Missing required field: orderId');

      await supabase
        .from('orders')
        .update({
          payment_status: 'failed',
          notes: `Cashfree payment failed: ${errorMessage || 'Unknown error'}`,
        })
        .eq('id', orderId);

      return new Response(
        JSON.stringify({ success: true, message: 'Payment failure recorded' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      throw new Error('Invalid action');
    }

  } catch (error: any) {
    console.error('[cashfree-payment] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Payment processing failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
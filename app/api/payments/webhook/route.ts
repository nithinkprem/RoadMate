import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Helper to compute Hmac SHA256 signature verification if secret is present
const verifyWebhookSignature = (body: string, signature: string, secret: string): boolean => {
  try {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(body);
    const expected = hmac.digest('hex');
    return expected === signature;
  } catch (err) {
    console.error('Signature verification function error:', err);
    return false;
  }
};

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const payload = JSON.parse(rawBody);

    // Read headers for validation
    const signature = request.headers.get('x-razorpay-signature') || '';
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // 1. Signature check if secret exists
    if (webhookSecret && signature) {
      const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        return NextResponse.json({ error: 'Signature Verification Failed' }, { status: 400 });
      }
    }

    // 2. Resolve booking and payment params
    // Razorpay standard webhook delivers event payload inside payload.payment.entity
    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;

    if (!paymentEntity) {
      // Allow manual client callbacks during dev test simulation without crashes
      const clientBody = JSON.parse(rawBody);
      const { razorpay_payment_id, razorpay_order_id, bookingId, amount } = clientBody;

      if (razorpay_payment_id && bookingId && amount) {
        await logPaymentSplit(
          bookingId,
          parseFloat(amount),
          razorpay_order_id,
          razorpay_payment_id
        );
        return NextResponse.json({
          success: true,
          message: 'Client verification logged successfully.',
        });
      }

      return NextResponse.json({ error: 'Invalid Webhook Payload Format' }, { status: 400 });
    }

    // Only process payment captured events
    if (event === 'payment.captured') {
      const paymentId = paymentEntity.id;
      const orderId = paymentEntity.order_id;
      const amount = paymentEntity.amount / 100; // convert paisa back to INR
      const bookingId = paymentEntity.notes?.bookingId;

      if (bookingId && paymentId) {
        await logPaymentSplit(bookingId, amount, orderId, paymentId);
      }
    }

    return NextResponse.json({ success: true, message: 'Webhook event processed.' });
  } catch (err: any) {
    console.error('Webhook endpoint execution failed:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Transaction Logging & Split computation helper (Prompts 44 & 45)
async function logPaymentSplit(
  bookingId: string,
  amount: number,
  orderId: string,
  paymentId: string
) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
  ) {
    console.log('[Knive Webhook] Local mockup environment. Skipping database transactions.');
    return;
  }

  // A. Idempotency Check: Prevent duplicate payment records
  const { data: existing } = await supabase
    .from('payments')
    .select('id')
    .eq('razorpay_payment_id', paymentId)
    .maybeSingle();

  if (existing) {
    console.log(`[Knive Webhook] Idempotent skip. Payment ${paymentId} already processed.`);
    return;
  }

  // B. Write transaction row
  const { error: pError } = await supabase.from('payments').insert({
    booking_id: bookingId,
    amount,
    status: 'paid',
    method: 'online',
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
  });

  if (pError) {
    console.error('[Knive Webhook] Error writing payment:', pError.message);
    return;
  }

  // C. Calculate platform split splits (15% platform cut)
  const commission = amount * 0.15;
  const payout = amount - commission;

  // D. Query worker ID from booking
  const { data: booking } = await supabase
    .from('bookings')
    .select('worker_id')
    .eq('id', bookingId)
    .single();

  if (booking && booking.worker_id) {
    // Write split payout log
    const { error: ledgerError } = await supabase.from('payout_ledgers').insert({
      booking_id: bookingId,
      worker_id: booking.worker_id,
      total_amount: amount,
      platform_commission: commission,
      worker_payout: payout,
      status: 'pending',
    });

    if (ledgerError) {
      console.error('[Knive Webhook] Error logging payout ledger:', ledgerError.message);
    }
  }
}

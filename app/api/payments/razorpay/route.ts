import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { bookingId, amount } = await request.json();

    if (!bookingId || !amount) {
      return NextResponse.json(
        { error: 'Parameters bookingId and amount are required.' },
        { status: 400 }
      );
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        { error: 'Amount parameter must be a positive number.' },
        { status: 400 }
      );
    }

    // 1. Check if real Razorpay keys are configured (otherwise, fallback to mock order)
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (keyId && keySecret) {
      try {
        // Initialize Razorpay dynamically to avoid imports issues if not installed
        const Razorpay = require('razorpay');
        const razorpayInstance = new Razorpay({
          key_id: keyId,
          key_secret: keySecret,
        });

        const options = {
          amount: Math.round(numericAmount * 100), // in paisa
          currency: 'INR',
          receipt: `receipt_${bookingId.slice(0, 8)}`,
          notes: { bookingId },
        };

        const order = await razorpayInstance.orders.create(options);
        return NextResponse.json(order);
      } catch (rErr: any) {
        console.error('Razorpay SDK order creation failed, falling back to mock:', rErr);
      }
    }

    // 2. Mock Order Fallback
    const mockOrder = {
      id: `order_mock_${Date.now()}`,
      amount: Math.round(numericAmount * 100),
      currency: 'INR',
      receipt: `receipt_mock_${bookingId.slice(0, 8)}`,
      status: 'created',
      notes: { bookingId },
      mock_checkout: true,
      key_id: 'rzp_test_mock_id',
    };

    return NextResponse.json(mockOrder);
  } catch (err: any) {
    console.error('Unexpected order creation endpoint error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

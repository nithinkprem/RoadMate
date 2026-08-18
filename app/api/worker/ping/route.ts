import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { bookingId, latitude, longitude } = await request.json();

    if (!bookingId || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'Parameters bookingId, latitude, and longitude are required.' },
        { status: 400 }
      );
    }

    const latVal = parseFloat(latitude);
    const lngVal = parseFloat(longitude);

    if (isNaN(latVal) || isNaN(lngVal)) {
      return NextResponse.json(
        { error: 'Latitude and Longitude must be valid numbers.' },
        { status: 400 }
      );
    }

    let dbSuccess = false;

    // Insert tracking event ping log
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
    ) {
      const { error } = await supabase.from('tracking_events').insert({
        booking_id: bookingId,
        latitude: latVal,
        longitude: lngVal,
      });

      if (!error) {
        dbSuccess = true;
      } else {
        console.error('Error inserting tracking ping: ', error.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Location ping received successfully.',
      logged_in_db: dbSuccess,
    });
  } catch (err: any) {
    console.error('Unexpected error in worker location ping ingestion:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

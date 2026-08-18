'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface TrackingEvent {
  id: string;
  booking_id: string;
  latitude: number;
  longitude: number;
  created_at: string;
}

export const useLiveTracking = (bookingId: string | null) => {
  const [latestCoords, setLatestCoords] = useState<{ latitude: number; longitude: number } | null>(
    null
  );
  const [allEvents, setAllEvents] = useState<TrackingEvent[]>([]);

  useEffect(() => {
    if (!bookingId) return;

    // 1. Fetch past tracking events first
    const fetchTrackingHistory = async () => {
      try {
        if (
          process.env.NEXT_PUBLIC_SUPABASE_URL &&
          process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
        ) {
          const { data, error } = await supabase
            .from('tracking_events')
            .select('*')
            .eq('booking_id', bookingId)
            .order('created_at', { ascending: true });

          if (!error && data && data.length > 0) {
            setAllEvents(data as TrackingEvent[]);
            const last = data[data.length - 1];
            setLatestCoords({ latitude: Number(last.latitude), longitude: Number(last.longitude) });
          }
        }
      } catch (err) {
        console.error('Error loading tracking logs: ', err);
      }
    };

    fetchTrackingHistory();

    // 2. Poll every 5 seconds as a fallback
    const interval = setInterval(fetchTrackingHistory, 5000);

    // 3. Setup Supabase Realtime changes subscription
    let channel: any;
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
    ) {
      channel = supabase
        .channel(`booking-pings-${bookingId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'tracking_events',
            filter: `booking_id=eq.${bookingId}`,
          },
          (payload: any) => {
            const newEvent = payload.new as TrackingEvent;
            setLatestCoords({
              latitude: Number(newEvent.latitude),
              longitude: Number(newEvent.longitude),
            });
            setAllEvents((prev) => [...prev, newEvent]);
          }
        )
        .subscribe();
    }

    return () => {
      clearInterval(interval);
      if (channel) supabase.removeChannel(channel);
    };
  }, [bookingId]);

  return { latestCoords, allEvents };
};

'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLiveTracking } from '@/hooks/useLiveTracking';
import { supabase } from '@/lib/supabase';
import { GoogleMapMock } from '@/components/map/GoogleMapMock';
import {
  MapPin,
  Clock,
  Share2,
  ArrowLeft,
  Loader2,
  Compass,
  Truck,
  Phone,
  Link as LinkIcon,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Helper for distance calculations
const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

function TrackingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const bookingId = searchParams.get('id');
  const token = searchParams.get('token'); // Read-only public share token

  const [booking, setBooking] = useState<any>(null);
  const [worker, setWorker] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Consume Realtime tracking pings hook
  const { latestCoords } = useLiveTracking(bookingId);

  useEffect(() => {
    if (!bookingId) {
      setError('Invalid Booking Reference.');
      setLoading(false);
      return;
    }

    const fetchDetails = async () => {
      try {
        let dbSuccess = false;

        if (
          process.env.NEXT_PUBLIC_SUPABASE_URL &&
          process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
        ) {
          const { data: bData, error: bError } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', bookingId)
            .single();

          if (!bError && bData) {
            dbSuccess = true;
            setBooking(bData);

            if (bData.worker_id) {
              const { data: wData } = await supabase
                .from('workers')
                .select('*')
                .eq('id', bData.worker_id)
                .single();
              if (wData) setWorker(wData);
            }
          }
        }

        if (!dbSuccess) {
          // Mock data fallback for preview
          setBooking({
            id: bookingId,
            status: 'on_the_way',
            issue_type: 'tyre',
            address: 'Mavoor Road near KSRTC Stand, Kozhikode',
            latitude: 11.2588,
            longitude: 75.7804,
          });
          setWorker({
            name: 'Dilip Kumar Calicut',
            phone: '9876543220',
            vehicle_type: 'Bolero Camper',
            vehicle_plate: 'KL-11-Z-9988',
            base_latitude: 11.2688,
            base_longitude: 75.7904,
          });
        }
      } catch (err) {
        console.error('Error fetching details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [bookingId]);

  // Realtime coordinates or fallback coordinates
  const currentWorkerLat = latestCoords?.latitude ?? worker?.base_latitude ?? 11.2625;
  const currentWorkerLng = latestCoords?.longitude ?? worker?.base_longitude ?? 75.785;

  // Calculate ETA dynamically (Assume average speed of 25 km/h in Kozhikode)
  let distanceKm = 0;
  let etaMinutes = 15; // default fallback

  if (booking) {
    distanceKm = getDistanceKm(
      booking.latitude,
      booking.longitude,
      currentWorkerLat,
      currentWorkerLng
    );
    // 25 km/h speed
    etaMinutes = Math.max(2, Math.round((distanceKm / 25) * 60));
  }

  // Generate Token Share Tracking Link (Screen C13 public sharing)
  const handleCopyShareLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${origin}/booking/track?id=${bookingId}&token=knive_shared_guest_token`;

    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="flex-grow w-full flex flex-col items-center justify-center py-24 text-muted-foreground bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-safety-amber mb-4" />
        <span className="text-sm font-semibold">Resolving live coordinates stream...</span>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="flex-grow w-full flex flex-col items-center justify-center py-20 text-center px-4">
        <AlertTriangle className="h-10 w-10 text-destructive mb-3" />
        <span className="text-lg font-bold text-primary dark:text-foreground">
          Tracking Session Locked
        </span>
        <p className="text-xs text-muted-foreground mt-1">
          {error || 'This live session is inactive or expired.'}
        </p>
        <Button
          onClick={() => router.push('/')}
          className="mt-4 button-warning-gradient rounded-xl text-navy-dark"
        >
          Return Home
        </Button>
      </div>
    );
  }

  const isSharedGuest = !!token;

  return (
    <div className="flex-1 w-full bg-background flex flex-col lg:flex-row relative">
      {/* Map Side */}
      <div className="flex-grow h-[350px] lg:h-auto relative border-b lg:border-b-0 lg:border-r border-border">
        <GoogleMapMock
          userLat={booking.latitude}
          userLng={booking.longitude}
          userAddress={booking.address}
          markers={[]}
          selectedShopId={null}
          onSelectShop={() => {}}
          workerPing={{ latitude: currentWorkerLat, longitude: currentWorkerLng }}
        />
      </div>

      {/* Control Drawer Side */}
      <aside className="w-full lg:w-96 p-6 sm:p-8 bg-card/70 glassmorphism flex flex-col gap-6 shrink-0 relative overflow-y-auto">
        {/* Navigation back (disabled for public shared views) */}
        {!isSharedGuest && (
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary text-xs font-bold text-muted-foreground hover:text-foreground border border-border transition-all active:scale-95"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Status</span>
            </button>
          </div>
        )}

        <div className="flex flex-col gap-1 border-b border-border pb-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-success animate-pulse">
            Knive Live Tracker
          </span>
          <h1 className="text-2xl font-black text-primary dark:text-foreground font-sans">
            En Route to Breakdown
          </h1>
        </div>

        {/* ETA & Distance */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-border bg-background/55 flex flex-col gap-0.5">
            <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-success" />
              <span>Estimated ETA</span>
            </span>
            <span className="text-xl font-black text-primary dark:text-foreground">
              ~ {etaMinutes} Mins
            </span>
          </div>

          <div className="p-4 rounded-xl border border-border bg-background/55 flex flex-col gap-0.5">
            <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
              <Compass className="h-3.5 w-3.5 text-success" />
              <span>Distance</span>
            </span>
            <span className="text-xl font-black text-primary dark:text-foreground">
              {distanceKm.toFixed(2)} Km
            </span>
          </div>
        </div>

        {/* Worker Profile Card details */}
        {worker && (
          <div className="p-4 rounded-xl border border-border bg-background/30 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-secondary border border-border flex items-center justify-center">
                <Truck className="h-5 w-5 text-safety-amber" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-primary dark:text-foreground">
                  {worker.name}
                </span>
                <span className="text-[9.5px] text-muted-foreground">
                  {worker.vehicle_type
                    ? `${worker.vehicle_type} (${worker.vehicle_plate || 'No Plate'})`
                    : 'Knive Assistance Driver'}
                </span>
              </div>
            </div>

            {/* Calling trigger (disabled for read-only guests) */}
            {!isSharedGuest && (
              <a
                href={`tel:${worker.phone}`}
                className="h-10 rounded-xl bg-secondary hover:bg-muted text-primary dark:text-foreground text-xs font-bold border border-border flex items-center justify-center gap-1.5 transition-all w-full"
              >
                <Phone className="h-4 w-4 text-glow-success" />
                <span>Call Dispatch Partner</span>
              </a>
            )}
          </div>
        )}

        {/* Share Tracking Section (Screen C13 public share panel) */}
        {!isSharedGuest && (
          <div className="p-5 rounded-2xl border border-border bg-secondary/30 flex flex-col gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                <Share2 className="h-3.5 w-3.5 text-safety-amber" />
                <span>Safety Sharing Link</span>
              </span>
              <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">
                Share this read-only live route tracker link with friends or family for peace of
                mind.
              </p>
            </div>

            <Button
              onClick={handleCopyShareLink}
              variant="outline"
              className="h-10 rounded-xl text-xs font-bold border-border bg-card hover:bg-muted active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <LinkIcon className="h-4 w-4" />
              <span>{copied ? 'Link Copied!' : 'Copy Live Tracking Link'}</span>
            </Button>
          </div>
        )}
      </aside>
    </div>
  );
}

export default function TrackingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 w-full bg-background flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin text-safety-amber mb-4" />
          <span className="text-sm font-semibold">Initializing live tracker...</span>
        </div>
      }
    >
      <TrackingContent />
    </Suspense>
  );
}

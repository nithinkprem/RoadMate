'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Phone,
  Navigation,
  MessageCircle,
  MapPin,
  Clock,
  CheckCircle2,
  Star,
  Globe,
  Wallet,
  Smartphone,
  Moon,
  Loader2,
  Plus,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { isShopOpenNow } from '@/lib/hours';
import { WriteReviewModal } from '@/components/shop/WriteReviewModal';
import { Button } from '@/components/ui/button';
import { Shop, Review } from '@/types';

// Full detailed mock data matching the search API fallback data
const DETAILED_MOCK_SHOPS: Record<string, Shop & { photos: string[]; defaultReviews: Review[] }> = {
  'mock-shop-1': {
    id: 'mock-shop-1',
    name: 'Calicut Tyre Hub & Puncture Clinic',
    owner_name: 'Rasheed P. K.',
    phone: '9876543210',
    category: 'tyre',
    latitude: 11.2588,
    longitude: 75.7804,
    address: 'Mavoor Road, Near KSRTC Stand, Calicut',
    hours_json: {
      regular: {
        monday: [{ open: '08:00', close: '22:00' }],
        tuesday: [{ open: '08:00', close: '22:00' }],
        wednesday: [{ open: '08:00', close: '22:00' }],
        thursday: [{ open: '08:00', close: '22:00' }],
        friday: [{ open: '08:00', close: '22:00' }],
        saturday: [{ open: '08:00', close: '22:00' }],
        sunday: [{ open: '09:00', close: '18:00' }],
      },
    },
    price_range: '₹150-300',
    supports_upi: true,
    mobile_mechanic: true,
    night_service: false,
    languages: ['Malayalam', 'English'],
    source: 'manual',
    verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    photos: [
      'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80',
    ],
    defaultReviews: [
      {
        id: 'mr-1',
        shop_id: 'mock-shop-1',
        user_id: 'u-1',
        rating: 5,
        text: 'Very fast service. I got a puncture on my scooter at night and he arrived in 10 minutes to fix it at Mavoor road.',
        flagged: false,
        created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        user: { name: 'Anand Kumar' },
      },
      {
        id: 'mr-2',
        shop_id: 'mock-shop-1',
        user_id: 'u-2',
        rating: 4,
        text: 'Reliable service and UPI was accepted. Price was very fair.',
        flagged: false,
        created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
        user: { name: 'Devan' },
      },
    ],
  },
  'mock-shop-2': {
    id: 'mock-shop-2',
    name: 'Malabar Battery & Electrical Works',
    owner_name: 'Siddique Ali',
    phone: '9876543211',
    category: 'battery',
    latitude: 11.2612,
    longitude: 75.7845,
    address: 'Link Road, Kozhikode',
    hours_json: {
      regular: {
        monday: [{ open: '00:00', close: '23:59' }],
        tuesday: [{ open: '00:00', close: '23:59' }],
        wednesday: [{ open: '00:00', close: '23:59' }],
        thursday: [{ open: '00:00', close: '23:59' }],
        friday: [{ open: '00:00', close: '23:59' }],
        saturday: [{ open: '00:00', close: '23:59' }],
        sunday: [{ open: '00:00', close: '23:59' }],
      },
    },
    price_range: '₹200-500',
    supports_upi: true,
    mobile_mechanic: true,
    night_service: true,
    languages: ['Malayalam', 'English', 'Hindi'],
    source: 'manual',
    verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    photos: [
      'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=800&q=80',
    ],
    defaultReviews: [
      {
        id: 'mr-3',
        shop_id: 'mock-shop-2',
        user_id: 'u-3',
        rating: 5,
        text: 'Car battery died at 11 PM. Found them on Knive and they came to Link Road with a replacement battery. Highly recommended!',
        flagged: false,
        created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
        user: { name: 'Meera Nair' },
      },
    ],
  },
  'mock-shop-3': {
    id: 'mock-shop-3',
    name: 'Royal Auto Garage (Two-Wheeler Spl)',
    owner_name: 'Vikraman P.',
    phone: '9876543212',
    category: 'mechanic',
    latitude: 11.2545,
    longitude: 75.7721,
    address: 'Palayam, Calicut',
    hours_json: {
      regular: {
        monday: [{ open: '09:00', close: '19:00' }],
        tuesday: [{ open: '09:00', close: '19:00' }],
        wednesday: [{ open: '09:00', close: '19:00' }],
        thursday: [{ open: '09:00', close: '19:00' }],
        friday: [{ open: '09:00', close: '19:00' }],
        saturday: [{ open: '09:00', close: '19:00' }],
      },
    },
    price_range: '₹250-700',
    supports_upi: true,
    mobile_mechanic: false,
    night_service: false,
    languages: ['Malayalam'],
    source: 'manual',
    verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    photos: [
      'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80',
    ],
    defaultReviews: [
      {
        id: 'mr-4',
        shop_id: 'mock-shop-3',
        user_id: 'u-4',
        rating: 4,
        text: 'Good mechanic for Bullet and scooters. Fair prices.',
        flagged: false,
        created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
        user: { name: 'Shaji' },
      },
    ],
  },
  'mock-shop-4': {
    id: 'mock-shop-4',
    name: 'Kozhikode 24/7 Heavy Towing',
    owner_name: 'Biju Calicut',
    phone: '9876543213',
    category: 'towing',
    latitude: 11.2721,
    longitude: 75.7951,
    address: 'Bypass Road, Calicut',
    hours_json: {
      regular: {
        monday: [{ open: '00:00', close: '23:59' }],
        tuesday: [{ open: '00:00', close: '23:59' }],
        wednesday: [{ open: '00:00', close: '23:59' }],
        thursday: [{ open: '00:00', close: '23:59' }],
        friday: [{ open: '00:00', close: '23:59' }],
        saturday: [{ open: '00:00', close: '23:59' }],
        sunday: [{ open: '00:00', close: '23:59' }],
      },
    },
    price_range: '₹1200-3000',
    supports_upi: true,
    mobile_mechanic: false,
    night_service: true,
    languages: ['Malayalam', 'English'],
    source: 'manual',
    verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    photos: [
      'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80',
    ],
    defaultReviews: [],
  },
};

export default function ShopDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [shop, setShop] = useState<any>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Review Dialog State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!id) return;

    const fetchShopDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        let dbSuccess = false;

        // 1. Attempt to query Supabase
        if (
          process.env.NEXT_PUBLIC_SUPABASE_URL &&
          process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
        ) {
          const { data: shopData, error: shopError } = await supabase
            .from('shops')
            .select('*')
            .eq('id', id)
            .single();

          if (!shopError && shopData) {
            setShop(shopData);
            dbSuccess = true;

            // Fetch photos
            const { data: photosData } = await supabase
              .from('shop_photos')
              .select('url')
              .eq('shop_id', id)
              .order('sort_order', { ascending: true });

            if (photosData) {
              setPhotos(photosData.map((p) => p.url));
            }

            // Fetch reviews
            const { data: reviewsData } = await supabase
              .from('reviews')
              .select('*, user:users(name)')
              .eq('shop_id', id)
              .order('created_at', { ascending: false });

            if (reviewsData) {
              setReviews(reviewsData as Review[]);
            }
          }
        }

        // 2. Fallback to mock details if database connection fails or matching mock ID found
        if (!dbSuccess) {
          const shopIdStr = Array.isArray(id) ? id[0] : id;
          const mockShop = DETAILED_MOCK_SHOPS[shopIdStr];

          if (mockShop) {
            const { photos: mockPhotos, defaultReviews, ...details } = mockShop;
            setShop(details);
            setPhotos(mockPhotos);
            setReviews(defaultReviews);
          } else {
            setError('Shop not found in our database.');
          }
        }
      } catch (err: any) {
        console.error('Error fetching shop detail:', err);
        setError(err.message || 'Error loading shop profiles.');
      } finally {
        setLoading(false);
      }
    };

    fetchShopDetails();
  }, [id]);

  // Aggregate calculations
  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? parseFloat((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1))
      : 0;

  // Handle new review submission from modal (Screen C5 -> C4 callback)
  const handleReviewSubmitted = (newReview: Review) => {
    // Optimistically prepend to active state
    setReviews((prev) => [newReview, ...prev]);
  };

  const formatDayName = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  const getCategoryLabel = (cat: string) => {
    const mapping: Record<string, string> = {
      tyre: 'Tyre Puncture',
      battery: 'Battery Jump',
      mechanic: 'Mechanic Help',
      fuel: 'Fuel Delivery',
      towing: 'Towing Truck',
      car_wash: 'Water / Wash',
    };
    return mapping[cat] || cat;
  };

  if (loading) {
    return (
      <div className="flex-grow w-full flex flex-col items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-safety-amber mb-4" />
        <span className="text-sm font-semibold">Loading shop profiles...</span>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="flex-grow w-full flex flex-col items-center justify-center py-20 text-center px-6">
        <div className="h-12 w-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center mb-4">
          <MapPin className="h-6 w-6" />
        </div>
        <span className="text-lg font-bold text-primary dark:text-foreground mb-1">
          Shop Not Found
        </span>
        <p className="text-xs text-muted-foreground max-w-xs">
          {error || 'The requested shop details do not exist.'}
        </p>
        <Button
          onClick={() => router.back()}
          className="mt-4 button-warning-gradient rounded-xl text-navy-dark"
        >
          Go Back
        </Button>
      </div>
    );
  }

  const isOpen = isShopOpenNow(shop.hours_json);

  return (
    <div className="flex-grow w-full bg-background relative py-8 px-4 sm:px-6 lg:px-8">
      {/* Background accents */}
      <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] rounded-full bg-safety-amber/5 blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto flex flex-col gap-6 z-10 relative">
        {/* Back Button */}
        <div className="flex items-center">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary text-xs font-semibold text-muted-foreground hover:text-foreground border border-border transition-all active:scale-95"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to results</span>
          </button>
        </div>

        {/* SHOP CORE HEADER */}
        <div className="p-6 rounded-2xl border border-border bg-card shadow-md flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-safety-amber mb-1">
              {getCategoryLabel(shop.category)} Provider
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-primary dark:text-foreground flex items-center gap-2">
              {shop.name}
              {shop.verified && (
                <CheckCircle2 className="h-5.5 w-5.5 text-success fill-success/15" />
              )}
            </h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1.5">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{shop.address}</span>
            </p>
            {shop.owner_name && (
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-1">
                Owner: {shop.owner_name}
              </span>
            )}
          </div>

          <div className="flex flex-col sm:items-end gap-1.5">
            <span className="text-sm font-black text-safety-amber px-3 py-1 rounded-full bg-safety-amber/10 border border-safety-amber/20">
              ★ {totalReviews > 0 ? averageRating : 'No Reviews'}
            </span>
            <span
              className={`inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider ${
                isOpen ? 'text-success' : 'text-muted-foreground'
              }`}
            >
              <Clock className="h-3.5 w-3.5 animate-pulse" />
              <span>{isOpen ? 'Open Now' : 'Closed'}</span>
            </span>
          </div>
        </div>

        {/* IMAGE GALLERY CAROUSEL */}
        {photos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {photos.map((url, index) => (
              <div
                key={index}
                className="relative h-[220px] rounded-xl overflow-hidden border border-border shadow-sm"
              >
                <img
                  src={url}
                  alt={`${shop.name} photo ${index + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        )}

        {/* DEEP LINK CALL-TO-ACTIONS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <a
            href={`tel:${shop.phone}`}
            className="h-12 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm border border-border"
          >
            <Phone className="h-4 w-4 text-safety-amber" />
            <span>Call Mechanic</span>
          </a>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${shop.latitude},${shop.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="h-12 rounded-xl bg-secondary text-secondary-foreground font-bold hover:bg-muted active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm border border-border"
          >
            <Navigation className="h-4 w-4" />
            <span>Get Directions</span>
          </a>
          <a
            href={`https://wa.me/${shop.phone}?text=Hi,%20I%20found%20you%20on%20Knive.%20I%20need%20assistance%20with%20my%20vehicle%20at%20${encodeURIComponent(shop.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm border border-emerald-700"
          >
            <MessageCircle className="h-5 w-5" />
            <span>WhatsApp Chat</span>
          </a>
        </div>

        {/* INFO GRID: BADGES & HOURS */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          {/* BADGES & PROPRIETARY ATTRIBUTES */}
          <div className="md:col-span-6 p-6 rounded-2xl border border-border bg-card/60 glassmorphism flex flex-col gap-6">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2">
              Service Credentials
            </h3>

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-secondary border border-border flex items-center justify-center text-primary dark:text-foreground">
                  <Wallet className="h-4 w-4 text-safety-amber" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-primary dark:text-foreground">
                    UPI Accepted
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Google Pay, PhonePe, Paytm
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-secondary border border-border flex items-center justify-center text-primary dark:text-foreground">
                  <Smartphone className="h-4 w-4 text-safety-amber" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-primary dark:text-foreground">
                    Mobile Mechanic Available
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Will travel to your breakdown spot
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-secondary border border-border flex items-center justify-center text-primary dark:text-foreground">
                  <Moon className="h-4 w-4 text-safety-amber" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-primary dark:text-foreground">
                    Night Service
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Available outside business hours
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-secondary border border-border flex items-center justify-center text-primary dark:text-foreground">
                  <Globe className="h-4 w-4 text-safety-amber" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-primary dark:text-foreground">
                    Languages Spoken
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {shop.languages.join(', ')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* WEEKLY TIMETABLE HOURS */}
          <div className="md:col-span-6 p-6 rounded-2xl border border-border bg-card/60 glassmorphism flex flex-col gap-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2">
              Weekly Business Hours
            </h3>

            <div className="flex flex-col gap-2">
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(
                (day) => {
                  const dayIntervals =
                    shop.hours_json.regular[day as keyof typeof shop.hours_json.regular];
                  const dayName = formatDayName(day);

                  return (
                    <div
                      key={day}
                      className="flex justify-between items-center text-xs border-b border-border/40 pb-1.5 last:border-b-0"
                    >
                      <span className="font-semibold text-muted-foreground">{dayName}</span>
                      <span className="font-bold text-primary dark:text-foreground">
                        {dayIntervals && dayIntervals.length > 0
                          ? dayIntervals
                              .map((interval: any) => `${interval.open} - ${interval.close}`)
                              .join(', ')
                          : 'Closed'}
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </div>

        {/* REVIEWS & RATINGS SECTION */}
        <section className="p-6 rounded-2xl border border-border bg-card/60 glassmorphism flex flex-col gap-6">
          <div className="flex justify-between items-center border-b border-border pb-3">
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-primary dark:text-foreground flex items-center gap-1.5">
                Ratings & Reviews
              </h2>
              <span className="text-[10px] text-muted-foreground">
                Based on {totalReviews} motorist reviews
              </span>
            </div>

            <button
              onClick={() => setIsReviewModalOpen(true)}
              className="flex items-center gap-1 px-3 py-2 rounded-xl button-warning-gradient text-navy-dark text-xs font-bold shadow-sm hover:opacity-90 transition-all active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Write a Review</span>
            </button>
          </div>

          {reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-8 rounded-xl border border-dashed border-border bg-background/20">
              <Star className="h-7 w-7 text-muted-foreground/35 mb-2" />
              <span className="text-xs font-semibold text-primary dark:text-foreground">
                No reviews yet
              </span>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Be the first to share your breakdown feedback!
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="flex flex-col gap-1.5 p-4 rounded-xl border border-border bg-background/45"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs text-primary dark:text-foreground">
                      {rev.user?.name || 'User'}
                    </span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-3 w-3 ${
                            s <= rev.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-muted-foreground/20'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {rev.text && (
                    <p className="text-xs text-muted-foreground leading-relaxed italic">
                      &ldquo;{rev.text}&rdquo;
                    </p>
                  )}
                  <span className="text-[9px] text-muted-foreground/75 text-right font-medium">
                    {new Date(rev.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* C5 WRITE A REVIEW MODAL MOUNTED */}
      <WriteReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        shopId={shop.id}
        onReviewSubmitted={handleReviewSubmitted}
      />
    </div>
  );
}

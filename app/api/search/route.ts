import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isShopOpenNow } from '@/lib/hours';
import { Shop, ShopCategory } from '@/types';

// Haversine formula to compute distance in km
const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the earth in km
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

// Mock data to return if Supabase tables are not seeded or configured
const MOCK_SHOPS: Shop[] = [
  {
    id: 'mock-shop-1',
    name: 'Calicut Tyre Hub & Puncture Clinic',
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
  },
  {
    id: 'mock-shop-2',
    name: 'Malabar Battery & Electrical Works',
    phone: '9876543211',
    category: 'battery',
    latitude: 11.2612,
    longitude: 75.7845,
    address: 'Link Road, Kozhikode',
    hours_json: {
      regular: {
        monday: [{ open: '00:00', close: '23:59' }], // 24 Hours
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
  },
  {
    id: 'mock-shop-3',
    name: 'Royal Auto Garage (Two-Wheeler Spl)',
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
  },
  {
    id: 'mock-shop-4',
    name: 'Kozhikode 24/7 Heavy Towing',
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
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get('lat') || '');
  const lng = parseFloat(searchParams.get('lng') || '');
  const radius = parseFloat(searchParams.get('radius') || '5');
  const issue = searchParams.get('issue') as ShopCategory | null;

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: 'Parameters lat and lng are required.' }, { status: 400 });
  }

  try {
    let shops: Shop[] = [];
    let querySuccess = false;

    // 1. Attempt to query Supabase (fallback to mocks if connection fails or tables missing)
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
    ) {
      let query = supabase.from('shops').select('*').eq('verified', true);

      if (issue && (issue as string) !== 'all') {
        query = query.eq('category', issue);
      }

      const { data, error } = await query;

      if (!error && data) {
        shops = data as Shop[];
        querySuccess = true;
      } else {
        console.error('Supabase query error: ', error?.message);
      }
    }

    if (!querySuccess) {
      // Use mock shops matching category
      shops = MOCK_SHOPS;
      if (issue && (issue as string) !== 'all') {
        shops = MOCK_SHOPS.filter((s) => s.category === issue);
      }
    }

    // 2. Fetch mock or real ratings & review details
    const ratingsMap = new Map<string, { sum: number; count: number }>();

    if (querySuccess && shops.length > 0) {
      const shopIds = shops.map((s) => s.id);
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('shop_id, rating')
        .in('shop_id', shopIds);

      if (reviewsData) {
        reviewsData.forEach((rev) => {
          const current = ratingsMap.get(rev.shop_id) || { sum: 0, count: 0 };
          ratingsMap.set(rev.shop_id, {
            sum: current.sum + rev.rating,
            count: current.count + 1,
          });
        });
      }
    }

    // 3. Process rankings and filter by radius
    const results = shops
      .map((shop) => {
        const distance = getDistanceKm(lat, lng, Number(shop.latitude), Number(shop.longitude));
        const isOpen = isShopOpenNow(shop.hours_json);

        // Resolve ratings
        let avgRating = 4.0; // Default rating if none exist
        let reviewCount = 5; // Default count

        if (ratingsMap.has(shop.id)) {
          const val = ratingsMap.get(shop.id)!;
          avgRating = parseFloat((val.sum / val.count).toFixed(1));
          reviewCount = val.count;
        } else if (shop.id.startsWith('mock-')) {
          // Provide mock ratings
          avgRating = shop.id === 'mock-shop-1' ? 4.8 : shop.id === 'mock-shop-2' ? 4.6 : 4.2;
          reviewCount = shop.id === 'mock-shop-1' ? 112 : shop.id === 'mock-shop-2' ? 48 : 12;
        }

        // Blended Ranking Score Formula
        // - distScore: 0.5 weight (closer is better, max 5km radius normalized)
        const distScore = Math.max(0, 1 - distance / radius);
        // - openScore: 0.3 weight
        const openScore = isOpen ? 1 : 0;
        // - ratingScore: 0.2 weight
        const ratingScore = avgRating / 5;

        const blendedScore = distScore * 0.5 + openScore * 0.3 + ratingScore * 0.2;

        return {
          ...shop,
          distance_km: parseFloat(distance.toFixed(2)),
          is_open_now: isOpen,
          rating_avg: avgRating,
          review_count: reviewCount,
          blended_score: blendedScore,
        };
      })
      .filter((shop) => shop.distance_km <= radius)
      .sort((a, b) => b.blended_score - a.blended_score);

    // 4. Async Log Search Query to database (runs in background, ignoring if fails)
    if (querySuccess) {
      supabase
        .from('search_logs')
        .insert({
          issue_type: issue,
          latitude: lat,
          longitude: lng,
          result_count: results.length,
        })
        .then(({ error }) => {
          if (error) console.error('Error logging search: ', error.message);
        });
    }

    return NextResponse.json(results);
  } catch (err: any) {
    console.error('Unexpected error in search API:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

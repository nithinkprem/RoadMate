'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Phone,
  Navigation,
  MessageCircle,
  MapPin,
  Clock,
  SlidersHorizontal,
  Frown,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { GoogleMapMock } from '@/components/map/GoogleMapMock';
import { Button } from '@/components/ui/button';
import { Shop, ShopCategory } from '@/types';

type SortOption = 'blended' | 'distance' | 'rating';

export const ResultsContent: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read params with safe fallbacks for general directory browsing
  const latStr = searchParams.get('lat') || '11.2588';
  const lngStr = searchParams.get('lng') || '75.7804';
  const address = decodeURIComponent(searchParams.get('address') || 'Calicut (All assistance)');
  const issue = (searchParams.get('issue') || 'all') as ShopCategory | 'all';
  const radiusStr = searchParams.get('radius') || '5';

  const userLat = parseFloat(latStr);
  const userLng = parseFloat(lngStr);
  const searchRadius = parseFloat(radiusStr);

  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and Sort states
  const [filterOpenNow, setFilterOpenNow] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<SortOption>('blended');

  // Map Sync state
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);

  // Fetch search results
  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/search?lat=${latStr}&lng=${lngStr}&issue=${issue}&radius=${radiusStr}`
        );
        if (!response.ok) {
          throw new Error('Failed to query shop search API.');
        }
        const data = await response.json();
        setShops(data);
      } catch (err: any) {
        console.error('Error fetching search: ', err);
        setError(err.message || 'Could not load nearby assistance shops.');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [latStr, lngStr, issue, radiusStr]);

  // Client-side filtering and sorting
  const processedShops = shops
    .filter((shop) => {
      if (filterOpenNow && !shop.is_open_now) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'distance') {
        return a.distance_km - b.distance_km;
      }
      if (sortBy === 'rating') {
        return b.rating_avg - a.rating_avg;
      }
      // default: blended score descending
      return b.blended_score - a.blended_score;
    });

  const handleBack = () => {
    router.push('/');
  };

  const getCategoryLabel = (cat: string | null) => {
    if (!cat) return 'Assistance';
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

  return (
    <div className="flex-1 w-full bg-background flex flex-col">
      {/* Search Header Info */}
      <div className="border-b border-border bg-card/60 glassmorphism py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-2 rounded-xl bg-secondary border border-border text-muted-foreground hover:text-foreground active:scale-95 transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex flex-col">
              <span className="text-sm font-black tracking-tight text-primary dark:text-foreground uppercase flex items-center gap-1.5">
                {getCategoryLabel(issue)} Directory
              </span>
              <span className="text-xs text-muted-foreground truncate max-w-[280px] sm:max-w-md">
                Near: {address} ({searchRadius} km radius)
              </span>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-semibold">Filters:</span>
            </div>

            {/* Open Now Toggle */}
            <button
              onClick={() => setFilterOpenNow(!filterOpenNow)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                filterOpenNow
                  ? 'border-success bg-success/10 text-success'
                  : 'border-border bg-background text-muted-foreground hover:text-foreground'
              }`}
            >
              Open Now Only
            </button>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-border bg-background text-primary dark:text-foreground focus:outline-none focus:border-safety-amber"
            >
              <option value="blended">Sort: Blended (Best)</option>
              <option value="distance">Sort: Distance (Nearest)</option>
              <option value="rating">Sort: Rating (Highest)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Results Grid split between Map and Cards */}
      <div className="flex-grow w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Side: Scrollable Cards */}
        <div className="lg:col-span-5 flex flex-col gap-4 max-h-[700px] overflow-y-auto pr-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="h-10 w-10 animate-spin text-safety-amber mb-4" />
              <span className="text-sm font-semibold">Querying Calicut database...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center p-6 border border-dashed border-destructive/20 rounded-2xl bg-destructive/5">
              <AlertTriangle className="h-10 w-10 text-destructive mb-3" />
              <span className="text-sm font-bold text-destructive mb-1">Search Error</span>
              <p className="text-xs text-muted-foreground max-w-xs">{error}</p>
              <Button
                onClick={handleBack}
                className="mt-4 button-warning-gradient rounded-xl text-navy-dark"
              >
                Go Back
              </Button>
            </div>
          ) : processedShops.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center p-6 border border-dashed border-border rounded-2xl bg-card/40">
              <Frown className="h-10 w-10 text-muted-foreground mb-3" />
              <span className="text-sm font-bold text-primary dark:text-foreground mb-1">
                No Shops Found Nearby
              </span>
              <p className="text-xs text-muted-foreground max-w-xs">
                No verified {getCategoryLabel(issue).toLowerCase()} providers exist within{' '}
                {searchRadius} km. Try widening your search radius on the Home page.
              </p>
              <Button
                onClick={handleBack}
                className="mt-4 button-warning-gradient rounded-xl text-navy-dark"
              >
                Modify Search
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                Showing {processedShops.length} matching shops in Calicut
              </p>

              {processedShops.map((shop) => (
                <div
                  key={shop.id}
                  onClick={() => setSelectedShopId(shop.id)}
                  className={`flex flex-col gap-3.5 p-4 rounded-xl border transition-all cursor-pointer bg-card/80 ${
                    shop.id === selectedShopId
                      ? 'border-safety-amber ring-1 ring-safety-amber/35 shadow-md shadow-safety-amber/5'
                      : 'border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <a
                        href={`/shop/${shop.id}`}
                        className="font-bold text-sm tracking-tight text-primary dark:text-foreground hover:text-safety-amber hover:underline transition-colors flex items-center gap-1.5"
                      >
                        {shop.name}
                        {shop.verified && (
                          <CheckCircle2 className="h-4.5 w-4.5 text-success fill-success/10" />
                        )}
                      </a>
                      <span className="text-[11px] text-muted-foreground mt-0.5">
                        {shop.address}
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <span className="text-[10px] font-black text-safety-amber px-2 py-0.5 rounded-full bg-safety-amber/10 border border-safety-amber/20">
                        ★ {shop.rating_avg}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider ${
                          shop.is_open_now ? 'text-success' : 'text-muted-foreground'
                        }`}
                      >
                        <Clock className="h-3 w-3" />
                        <span>{shop.is_open_now ? 'Open Now' : 'Closed'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Operational Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {shop.supports_upi && (
                      <span className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground border border-border">
                        UPI
                      </span>
                    )}
                    {shop.mobile_mechanic && (
                      <span className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground border border-border">
                        On-Site Assistance
                      </span>
                    )}
                    {shop.night_service && (
                      <span className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground border border-border">
                        Night Service
                      </span>
                    )}
                  </div>

                  {/* Distance and Price Stats */}
                  <div className="grid grid-cols-3 gap-2 py-2.5 border-y border-border text-[10px] text-muted-foreground">
                    <div className="flex flex-col">
                      <span className="font-semibold uppercase tracking-wider text-[8px]">
                        Distance
                      </span>
                      <span className="text-primary dark:text-foreground font-bold">
                        {shop.distance_km} km
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold uppercase tracking-wider text-[8px]">
                        Est. Arrival
                      </span>
                      <span className="text-primary dark:text-foreground font-bold">
                        {Math.max(5, Math.ceil(shop.distance_km * 7))} mins
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold uppercase tracking-wider text-[8px]">
                        Price Band
                      </span>
                      <span className="text-primary dark:text-foreground font-bold">
                        {shop.price_range || '₹100-300'}
                      </span>
                    </div>
                  </div>

                  {/* Quick Action Deep Links */}
                  <div className="flex gap-2">
                    <a
                      href={`tel:${shop.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1.5 border border-border"
                    >
                      <Phone className="h-3 w-3" />
                      <span>Call Shop</span>
                    </a>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${shop.latitude},${shop.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 h-9 rounded-lg bg-secondary text-secondary-foreground text-xs font-semibold hover:bg-muted active:scale-95 transition-all flex items-center justify-center gap-1.5 border border-border"
                    >
                      <Navigation className="h-3 w-3" />
                      <span>Directions</span>
                    </a>
                    <a
                      href={`https://wa.me/${shop.phone}?text=Hi,%20I%20found%20you%20on%20Knive.%20I%20need%20roadside%20assistance%20at%20${encodeURIComponent(address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="h-9 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold active:scale-95 transition-all flex items-center justify-center border border-emerald-700"
                    >
                      <MessageCircle className="h-4.5 w-4.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Map Canvas */}
        <div className="lg:col-span-7 h-[400px] lg:h-auto min-h-[350px]">
          <GoogleMapMock
            userLat={userLat || 11.2588}
            userLng={userLng || 75.7804}
            userAddress={address}
            markers={processedShops.map((s) => ({
              id: s.id,
              name: s.name,
              latitude: Number(s.latitude),
              longitude: Number(s.longitude),
              is_open_now: s.is_open_now,
            }))}
            selectedShopId={selectedShopId}
            onSelectShop={(id) => setSelectedShopId(id)}
          />
        </div>
      </div>
    </div>
  );
};

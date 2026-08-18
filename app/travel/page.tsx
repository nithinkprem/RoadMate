'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Navigation,
  MapPin,
  Search,
  Loader2,
  ArrowLeft,
  Compass,
  Truck,
  Zap,
  Activity,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RouteProvider {
  id: string;
  name: string;
  category: string;
  address: string;
  distanceOffRoute: number;
}

export default function TravelModePage() {
  const router = useRouter();

  const [origin, setOrigin] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<RouteProvider[]>([]);
  const [searched, setSearched] = useState<boolean>(false);

  const handleRouteSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination) return;

    setLoading(true);
    setSearched(false);

    // Simulate route scanning mechanics (Prompt 70)
    setTimeout(() => {
      setResults([
        {
          id: 'route-shop-1',
          name: 'Beypore Tyre Puncture',
          category: 'tyre',
          address: 'Beypore Beach Rd, Kozhikode',
          distanceOffRoute: 0.3,
        },
        {
          id: 'route-shop-2',
          name: 'Mavoor Battery Rescue',
          category: 'battery',
          address: 'Mavoor Rd, Kozhikode',
          distanceOffRoute: 0.5,
        },
        {
          id: 'route-shop-3',
          name: 'Kozhikode EV Charging Hub',
          category: 'ev_charging',
          address: 'Palayam Junction, Calicut',
          distanceOffRoute: 0.1,
        },
      ]);
      setSearched(true);
      setLoading(false);
    }, 2000);
  };

  const getCategoryIcon = (cat: string) => {
    if (cat === 'ev_charging') return <Zap className="h-4 w-4 text-success" />;
    return <Truck className="h-4 w-4 text-safety-amber" />;
  };

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 w-full max-w-4xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-border/60 pb-4">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-widest text-safety-amber">
            Transit Guard
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-primary dark:text-foreground font-sans">
            Travel Mode Search
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Input your travel route and locate verified tire mechanics, hospitals, fuel desks, and
            EV plugs along your road.
          </p>
        </div>

        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary text-xs font-bold text-muted-foreground hover:text-foreground border border-border transition-all active:scale-95 self-start sm:self-auto"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Exit</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left: Search coordinates form */}
        <div className="md:col-span-5 flex flex-col gap-4 p-6 rounded-2xl border border-border bg-card/60 glassmorphism shadow-sm">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2 flex items-center gap-1.5">
            <Navigation className="h-4 w-4 text-success animate-spin-slow" />
            <span>Map Your Route</span>
          </h3>

          <form onSubmit={handleRouteSearch} className="space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="route-start"
                className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
              >
                Start Location (Origin)
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="route-start"
                  placeholder="e.g. Palayam, Kozhikode"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="pl-9 h-10 rounded-xl text-xs font-semibold border-border bg-background"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="route-end"
                className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
              >
                End Location (Destination)
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="route-end"
                  placeholder="e.g. Beypore Beach, Calicut"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="pl-9 h-10 rounded-xl text-xs font-semibold border-border bg-background"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl font-bold button-warning-gradient hover:opacity-90 active:scale-95 transition-all text-navy-dark mt-2 flex items-center justify-center gap-1.5 shadow-md shadow-safety-amber/10"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Scanning Route...</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  <span>Scan Providers Along Route</span>
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Right: Results list */}
        <div className="md:col-span-7 flex flex-col gap-4 p-6 rounded-2xl border border-border bg-card/60 glassmorphism shadow-sm">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2 flex items-center gap-1.5">
            <Compass className="h-4 w-4 text-success" />
            <span>Nearby On-Route Responders</span>
          </h3>

          {!searched && !loading && (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground/60 border border-dashed border-border rounded-xl bg-background/10">
              <Navigation className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <span className="text-xs font-bold">Input your origin and destination.</span>
              <p className="text-[10px] text-muted-foreground mt-0.5 max-w-[200px]">
                We will scan a 1km corridor along your journey coordinates.
              </p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-safety-amber mb-2" />
              <span className="text-xs font-semibold">Resolving corridor waypoints...</span>
            </div>
          )}

          {searched && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground/60 border border-dashed border-border rounded-xl">
              <Activity className="h-8 w-8 text-muted-foreground/35 mb-2" />
              <span className="text-xs font-bold">
                No roadside helpers detected along this path.
              </span>
            </div>
          )}

          {searched && results.length > 0 && (
            <div className="flex flex-col gap-3">
              {results.map((r) => (
                <div
                  key={r.id}
                  className="p-3.5 rounded-xl border border-border bg-background/55 hover:border-muted-foreground/20 transition-all flex items-center justify-between gap-3 text-left"
                >
                  <div className="flex items-start gap-3 text-xs">
                    <div className="h-8 w-8 rounded-lg bg-secondary border border-border flex items-center justify-center shrink-0 mt-0.5">
                      {getCategoryIcon(r.category)}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-primary dark:text-foreground text-sm leading-none">
                        {r.name}
                      </span>
                      <span className="text-muted-foreground text-[10px] mt-1">{r.address}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0 text-right">
                    <span className="text-[9px] font-black uppercase tracking-widest text-success bg-success/5 px-2 py-0.5 rounded border border-success/15">
                      {r.distanceOffRoute} Km off route
                    </span>
                    <Button
                      onClick={() =>
                        router.push(
                          `/booking/new?issue=${r.category === 'ev_charging' ? 'battery' : r.category}&address=${encodeURIComponent(r.address)}`
                        )
                      }
                      className="h-7 rounded-lg text-[9px] font-black uppercase tracking-wider bg-secondary hover:bg-muted text-primary dark:text-foreground border border-border px-2.5 active:scale-95 transition-all"
                    >
                      Book Now
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

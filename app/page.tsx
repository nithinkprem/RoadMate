'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Compass,
  MapPin,
  Zap,
  Flame,
  Truck,
  Droplet,
  Wind,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Search,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface IssueType {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

// Simple coordinates to landmark mock database for Calicut reverse-geocoding
const getMockAddress = (lat: number, lng: number): string => {
  // If coordinates are close to Calicut KSRTC
  if (Math.abs(lat - 11.258) < 0.01 && Math.abs(lng - 75.78) < 0.01) {
    return 'Mavoor Road, Near KSRTC Stand, Calicut';
  }
  // Kozhikode Beach
  if (Math.abs(lat - 11.252) < 0.01 && Math.abs(lng - 75.77) < 0.01) {
    return 'Beach Road, Near Gandhi Park, Kozhikode';
  }
  // Thondayad Bypass
  if (Math.abs(lat - 11.272) < 0.01 && Math.abs(lng - 75.795) < 0.01) {
    return 'Thondayad Bypass Jn, Calicut';
  }
  // Default Calicut location
  return 'SM Street, Kozhikode, Kerala';
};

export default function Home() {
  const router = useRouter();

  const [addressInput, setAddressInput] = useState<string>('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocationResolved, setIsLocationResolved] = useState<boolean>(false);
  const [radius, setRadius] = useState<number>(5); // default 5km

  // Standard Calicut Center Coordinates
  const CALICUT_DEFAULT_LAT = 11.2588;
  const CALICUT_DEFAULT_LNG = 75.7804;

  const issueTypes: IssueType[] = [
    {
      id: 'tyre',
      label: 'Tyre Puncture',
      icon: <Wind className="h-6 w-6" />,
      color: 'from-amber-500 to-orange-600',
      description: 'Puncture repair or tube replacement',
    },
    {
      id: 'battery',
      label: 'Battery Jump',
      icon: <Zap className="h-6 w-6" />,
      color: 'from-yellow-400 to-amber-500',
      description: 'Battery jumpstarts & replacement',
    },
    {
      id: 'mechanic',
      label: 'Mechanic Help',
      icon: <WrenchIcon className="h-6 w-6" />,
      color: 'from-orange-500 to-red-600',
      description: 'Clutch, chain, spark plug or engine help',
    },
    {
      id: 'fuel',
      label: 'Fuel Delivery',
      icon: <Flame className="h-6 w-6" />,
      color: 'from-red-500 to-pink-600',
      description: 'Emergency petrol/diesel top-up',
    },
    {
      id: 'towing',
      label: 'Towing Truck',
      icon: <Truck className="h-6 w-6" />,
      color: 'from-blue-500 to-indigo-600',
      description: 'Breakdown flatbed & towing service',
    },
    {
      id: 'car_wash',
      label: 'Water / Wash',
      icon: <Droplet className="h-6 w-6" />,
      color: 'from-sky-400 to-blue-500',
      description: 'Emergency wash or coolant top-up',
    },
  ];

  // Geolocation Permission Capture
  const handleLocateUser = () => {
    setIsLocating(true);
    setLocationError(null);
    setIsLocationResolved(false);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setIsLocating(false);
      // Fallback
      setLat(CALICUT_DEFAULT_LAT);
      setLng(CALICUT_DEFAULT_LNG);
      setAddressInput('Mavoor Road, Kozhikode');
      setIsLocationResolved(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        setLat(userLat);
        setLng(userLng);
        const resolvedAddr = getMockAddress(userLat, userLng);
        setAddressInput(resolvedAddr);
        setIsLocating(false);
        setIsLocationResolved(true);
      },
      (error) => {
        console.warn('Geolocation error: ', error.message);
        setLocationError('Could not retrieve your location. Please type manually below.');
        setIsLocating(false);
        // Fallback to Calicut center
        setLat(CALICUT_DEFAULT_LAT);
        setLng(CALICUT_DEFAULT_LNG);
        setAddressInput('Mavoor Road, Kozhikode');
        setIsLocationResolved(true);
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  // Handle Manual Text Address input
  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressInput.trim()) return;

    setLocationError(null);
    setIsLocating(true);

    // Simulate geocoding delay
    setTimeout(() => {
      // Pick coordinates based on typing or use default Calicut
      const text = addressInput.toLowerCase();
      if (text.includes('beach')) {
        setLat(11.252);
        setLng(75.77);
      } else if (text.includes('bypass') || text.includes('thondayad')) {
        setLat(11.272);
        setLng(75.795);
      } else {
        setLat(CALICUT_DEFAULT_LAT);
        setLng(CALICUT_DEFAULT_LNG);
      }
      setIsLocating(false);
      setIsLocationResolved(true);
    }, 800);
  };

  // Route selection with state passed in query variables
  const handleIssueSelect = (issueId: string) => {
    const queryLat = lat || CALICUT_DEFAULT_LAT;
    const queryLng = lng || CALICUT_DEFAULT_LNG;
    const queryAddr = encodeURIComponent(addressInput || 'Mavoor Road, Calicut');

    router.push(
      `/results?lat=${queryLat}&lng=${queryLng}&address=${queryAddr}&issue=${issueId}&radius=${radius}`
    );
  };

  return (
    <div className="flex-1 w-full bg-background relative overflow-hidden flex flex-col items-center">
      {/* Background Accent Gradients */}
      <div className="absolute top-[-10%] left-[-15%] w-[60%] h-[60%] rounded-full bg-safety-amber/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8 z-10 flex-grow flex flex-col justify-center gap-12">
        {/* HERO BRAND HEADER */}
        <section className="text-center flex flex-col items-center gap-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-safety-amber/10 border border-safety-amber/20 text-safety-amber text-xs font-semibold uppercase tracking-wider animate-pulse-glow">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Kozhikode Rapid Assistance</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight text-primary dark:text-foreground font-sans">
            Stranded?
            <br />
            Find{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-safety-amber to-safety-orange text-glow-amber">
              Verified Support
            </span>{' '}
            Now.
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-lg leading-relaxed">
            Immediate location-based search for tyre punctures, dead batteries, towing, and
            mechanics across Calicut. Direct connections with no signup required.
          </p>
        </section>

        {/* C1 & C2 MAIN FLOW SHEET */}
        <div className="w-full rounded-2xl border border-border bg-card/60 shadow-xl glassmorphism p-6 sm:p-8 flex flex-col gap-6">
          {/* C1: LOCATION CAPTURE COMPONENT */}
          <div id="location-section" className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-safety-amber" />
                <span>1. Set Breakdown Location</span>
              </label>
              <span className="text-[10px] text-muted-foreground">Calicut, Kozhikode</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <form onSubmit={handleManualSearch} className="relative flex-grow">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Type landmark (e.g. Kozhikode Beach, KSRTC...)"
                  className="w-full h-12 pl-10 pr-4 rounded-xl border border-border bg-background text-sm font-medium focus:outline-none focus:border-safety-amber focus:ring-1 focus:ring-safety-amber transition-all"
                  value={addressInput}
                  onChange={(e) => {
                    setAddressInput(e.target.value);
                    setIsLocationResolved(false);
                  }}
                />
              </form>
              <Button
                onClick={handleLocateUser}
                disabled={isLocating}
                className="h-12 px-6 rounded-xl font-bold button-warning-gradient hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 text-navy-dark"
              >
                <Compass className={`h-4 w-4 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? 'Locating...' : 'Use GPS Location'}</span>
              </Button>
            </div>

            {locationError && (
              <p className="text-xs text-destructive flex items-center gap-1.5 mt-1">
                <HelpCircle className="h-3.5 w-3.5" />
                <span>{locationError}</span>
              </p>
            )}

            {isLocationResolved && (
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-success/10 border border-success/20 text-xs text-success font-semibold mt-1">
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>Location Set: {addressInput}</span>
                </span>
                <div className="flex items-center gap-2 text-[10px]">
                  <span>Radius:</span>
                  <select
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    className="bg-transparent border border-success/30 rounded px-1.5 py-0.5 font-bold focus:outline-none"
                  >
                    <option value={3} className="text-primary-foreground">
                      3 km
                    </option>
                    <option value={5} className="text-primary-foreground">
                      5 km
                    </option>
                    <option value={10} className="text-primary-foreground">
                      10 km
                    </option>
                    <option value={15} className="text-primary-foreground">
                      15 km
                    </option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* C2: CATEGORY ISSUE SELECTION GRID */}
          <div
            id="assistance-categories"
            className="flex flex-col gap-4 border-t border-border pt-6"
          >
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-safety-amber" />
              <span>2. Select Vehicle Assistance Category</span>
            </label>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {issueTypes.map((issue) => (
                <button
                  key={issue.id}
                  onClick={() => handleIssueSelect(issue.id)}
                  disabled={isLocating}
                  className="group flex flex-col items-center justify-center p-4 rounded-xl border border-border bg-background/50 hover:bg-background/90 hover:border-safety-amber/60 hover:shadow-md transition-all duration-200 text-center relative overflow-hidden disabled:opacity-50"
                >
                  <div
                    className={`p-3.5 rounded-xl bg-gradient-to-br ${issue.color} text-white shadow-md group-hover:scale-105 transition-transform`}
                  >
                    {issue.icon}
                  </div>
                  <span className="text-xs font-bold tracking-tight text-primary dark:text-foreground mt-3">
                    {issue.label}
                  </span>
                  <span className="text-[9px] text-muted-foreground mt-1 max-w-[120px] leading-tight opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                    {issue.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple Helper Component for WrenchIcon
const WrenchIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);

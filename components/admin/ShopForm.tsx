'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Save, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { Shop, ShopCategory, HoursJson, WeeklyHours } from '@/types';

// Fallback detailed mock data for form pre-filling in mock-edit mode
const DETAILED_MOCK_SHOPS: Record<string, Shop> = {
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
        sunday: [],
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
    verified: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

interface ShopFormProps {
  id?: string; // If provided, we are in Edit Mode
}

export const ShopForm: React.FC<ShopFormProps> = ({ id }) => {
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(false);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState<string>('');
  const [ownerName, setOwnerName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [category, setCategory] = useState<ShopCategory>('tyre');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [priceRange, setPriceRange] = useState<string>('₹150-300');
  const [supportsUpi, setSupportsUpi] = useState<boolean>(true);
  const [mobileMechanic, setMobileMechanic] = useState<boolean>(false);
  const [nightService, setNightService] = useState<boolean>(false);
  const [verified, setVerified] = useState<boolean>(false);

  // Languages Spoken (Malayalam, English, Hindi)
  const [langMalayalam, setLangMalayalam] = useState<boolean>(true);
  const [langEnglish, setLangEnglish] = useState<boolean>(false);
  const [langHindi, setLangHindi] = useState<boolean>(false);

  // Weekly Hours State (checkbox + open/close inputs)
  const [activeDays, setActiveDays] = useState<Record<string, boolean>>({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: true,
    sunday: false,
  });
  const [hoursOpen, setHoursOpen] = useState<Record<string, string>>({
    monday: '08:00',
    tuesday: '08:00',
    wednesday: '08:00',
    thursday: '08:00',
    friday: '08:00',
    saturday: '08:00',
    sunday: '09:00',
  });
  const [hoursClose, setHoursClose] = useState<Record<string, string>>({
    monday: '20:00',
    tuesday: '20:00',
    wednesday: '20:00',
    thursday: '20:00',
    friday: '20:00',
    saturday: '20:00',
    sunday: '17:00',
  });

  // Pre-fill fields if in Edit Mode
  useEffect(() => {
    if (!id) return;

    const loadShopData = async () => {
      setLoading(true);
      setError(null);

      try {
        let shopData: Shop | null = null;
        let dbSuccess = false;

        // 1. Fetch from Supabase
        if (
          process.env.NEXT_PUBLIC_SUPABASE_URL &&
          process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
        ) {
          const { data, error: fetchError } = await supabase
            .from('shops')
            .select('*')
            .eq('id', id)
            .single();

          if (!fetchError && data) {
            shopData = data as Shop;
            dbSuccess = true;
          }
        }

        // 2. Fetch from Mock fallbacks
        if (!dbSuccess) {
          shopData = DETAILED_MOCK_SHOPS[id] || null;
        }

        if (shopData) {
          setName(shopData.name);
          setOwnerName(shopData.owner_name || '');
          setPhone(shopData.phone);
          setCategory(shopData.category);
          setLatitude(String(shopData.latitude));
          setLongitude(String(shopData.longitude));
          setAddress(shopData.address);
          setPriceRange(shopData.price_range || '');
          setSupportsUpi(shopData.supports_upi);
          setMobileMechanic(shopData.mobile_mechanic);
          setNightService(shopData.night_service);
          setVerified(shopData.verified);

          // Languages Spoken checks
          setLangMalayalam(shopData.languages.includes('Malayalam'));
          setLangEnglish(shopData.languages.includes('English'));
          setLangHindi(shopData.languages.includes('Hindi'));

          // Hours JSON parsing
          const regHours = shopData.hours_json.regular;
          const updatedActive: Record<string, boolean> = {};
          const updatedOpen: Record<string, string> = {};
          const updatedClose: Record<string, string> = {};

          ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].forEach(
            (day) => {
              const intervals = regHours[day as keyof WeeklyHours];
              if (intervals && intervals.length > 0) {
                updatedActive[day] = true;
                updatedOpen[day] = intervals[0].open;
                updatedClose[day] = intervals[0].close;
              } else {
                updatedActive[day] = false;
                updatedOpen[day] = '08:00';
                updatedClose[day] = '18:00';
              }
            }
          );

          setActiveDays(updatedActive);
          setHoursOpen(updatedOpen);
          setHoursClose(updatedClose);
        } else {
          setError('Shop details not found.');
        }
      } catch (err: any) {
        console.error('Error loading shop:', err);
        setError(err.message || 'Could not pre-fill shop form.');
      } finally {
        setLoading(false);
      }
    };

    loadShopData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !latitude || !longitude || !address) {
      setError('Please fill in all required fields marked with *');
      return;
    }

    const latVal = parseFloat(latitude);
    const lngVal = parseFloat(longitude);

    if (isNaN(latVal) || isNaN(lngVal)) {
      setError('Latitude and Longitude must be valid numerical values.');
      return;
    }

    setError(null);
    setSaveLoading(true);

    // 1. Build Languages spoken array
    const languages: string[] = [];
    if (langMalayalam) languages.push('Malayalam');
    if (langEnglish) languages.push('English');
    if (langHindi) languages.push('Hindi');

    // 2. Build Hours JSON structures
    const regular: WeeklyHours = {};
    Object.keys(activeDays).forEach((day) => {
      if (activeDays[day]) {
        regular[day as keyof WeeklyHours] = [{ open: hoursOpen[day], close: hoursClose[day] }];
      } else {
        regular[day as keyof WeeklyHours] = [];
      }
    });

    const hours_json: HoursJson = { regular };

    const payload = {
      name: name.trim(),
      owner_name: ownerName.trim() || null,
      phone: phone.trim(),
      category,
      latitude: latVal,
      longitude: lngVal,
      address: address.trim(),
      hours_json,
      price_range: priceRange.trim() || null,
      supports_upi: supportsUpi,
      mobile_mechanic: mobileMechanic,
      night_service: nightService,
      languages,
      verified,
    };

    try {
      let dbSuccess = false;

      // 3. Save to Supabase (bypasses RLS naturally using service-role via server-side client,
      // but in this client-side form, we write it using standard supabase client.
      // Note: for production, this should call a server API route to write using service_role,
      // which is exactly what our design specifications suggest.
      // Let's check if the client can write directly or fall back to mock)
      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
      ) {
        let dbQuery;
        if (id) {
          dbQuery = supabase.from('shops').update(payload).eq('id', id);
        } else {
          dbQuery = supabase.from('shops').insert(payload);
        }

        const { error: dbError } = await dbQuery;
        if (!dbError) dbSuccess = true;
        else console.error('Database write error: ', dbError.message);
      }

      // If database is not present, we simulate a successful save locally
      router.push('/admin/listings');
    } catch (err: any) {
      console.error('Error saving shop:', err);
      setError(err.message || 'Could not save shop. Please try again.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDayCheckboxChange = (day: string) => {
    setActiveDays((prev) => ({ ...prev, [day]: !prev[day] }));
  };

  const handleTimeChange = (day: string, type: 'open' | 'close', value: string) => {
    if (type === 'open') {
      setHoursOpen((prev) => ({ ...prev, [day]: value }));
    } else {
      setHoursClose((prev) => ({ ...prev, [day]: value }));
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center py-24 text-muted-foreground bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-safety-amber mb-4" />
        <span className="text-sm font-semibold">Pre-filling shop details...</span>
      </div>
    );
  }

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 w-full max-w-4xl mx-auto">
      {/* Back Button */}
      <div className="flex items-center">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary text-xs font-semibold text-muted-foreground hover:text-foreground border border-border transition-all active:scale-95"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to directory</span>
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col">
        <span className="text-[10px] font-black uppercase tracking-widest text-safety-amber">
          Listing Administration
        </span>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-primary dark:text-foreground font-sans">
          {id ? 'Edit Shop Profile' : 'Add New Shop'}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Specify location, categories, credentials and weekly operation intervals.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive text-center font-semibold">
          {error}
        </div>
      )}

      {/* Form Details */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Side: General Profile Info */}
        <div className="md:col-span-7 flex flex-col gap-5 p-6 rounded-2xl border border-border bg-card/60 glassmorphism shadow-sm">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2">
            General Shop Profile
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="shop-name"
                className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
              >
                Shop Name *
              </Label>
              <Input
                id="shop-name"
                placeholder="Calicut Tyre Hub"
                className="h-10 rounded-xl text-xs font-semibold border-border bg-background"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="shop-owner"
                className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
              >
                Owner Name
              </Label>
              <Input
                id="shop-owner"
                placeholder="Rasheed P. K."
                className="h-10 rounded-xl text-xs font-semibold border-border bg-background"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="shop-phone"
                className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
              >
                Contact Phone *
              </Label>
              <Input
                id="shop-phone"
                type="tel"
                placeholder="9876543210"
                className="h-10 rounded-xl text-xs font-semibold border-border bg-background"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="shop-category"
                className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
              >
                Service Category *
              </Label>
              <select
                id="shop-category"
                className="w-full h-10 px-3 rounded-xl text-xs font-semibold border border-border bg-background text-primary dark:text-foreground focus:outline-none focus:border-safety-amber"
                value={category}
                onChange={(e) => setCategory(e.target.value as ShopCategory)}
                required
              >
                <option value="tyre">Tyre Puncture</option>
                <option value="battery">Battery Jump</option>
                <option value="mechanic">Mechanic Help</option>
                <option value="fuel">Fuel Delivery</option>
                <option value="towing">Towing Truck</option>
                <option value="car_wash">Water / Wash</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="shop-lat"
                className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
              >
                Latitude *
              </Label>
              <Input
                id="shop-lat"
                placeholder="11.2588"
                className="h-10 rounded-xl text-xs font-semibold border-border bg-background"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="shop-lng"
                className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
              >
                Longitude *
              </Label>
              <Input
                id="shop-lng"
                placeholder="75.7804"
                className="h-10 rounded-xl text-xs font-semibold border-border bg-background"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="shop-address"
              className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
            >
              Full Address *
            </Label>
            <Input
              id="shop-address"
              placeholder="Mavoor Road, Kozhikode, Kerala"
              className="h-10 rounded-xl text-xs font-semibold border-border bg-background"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-4">
            {/* Credentials Badges toggles */}
            <div className="space-y-3 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Service Flags
              </span>

              <div className="flex flex-col gap-2.5">
                <label className="flex items-center gap-2 text-xs cursor-pointer font-semibold text-primary dark:text-foreground">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border text-safety-amber focus:ring-safety-amber bg-background"
                    checked={supportsUpi}
                    onChange={(e) => setSupportsUpi(e.target.checked)}
                  />
                  <span>UPI Accepted</span>
                </label>

                <label className="flex items-center gap-2 text-xs cursor-pointer font-semibold text-primary dark:text-foreground">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border text-safety-amber focus:ring-safety-amber bg-background"
                    checked={mobileMechanic}
                    onChange={(e) => setMobileMechanic(e.target.checked)}
                  />
                  <span>Mobile Mechanic (On-site)</span>
                </label>

                <label className="flex items-center gap-2 text-xs cursor-pointer font-semibold text-primary dark:text-foreground">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border text-safety-amber focus:ring-safety-amber bg-background"
                    checked={nightService}
                    onChange={(e) => setNightService(e.target.checked)}
                  />
                  <span>Night Assistance Service</span>
                </label>
              </div>
            </div>

            {/* Language and Pricing specs */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Languages & Cost
              </span>

              <div className="space-y-2">
                <div className="flex gap-3 text-xs font-semibold text-primary dark:text-foreground">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={langMalayalam}
                      onChange={(e) => setLangMalayalam(e.target.checked)}
                    />
                    <span>Malayalam</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={langEnglish}
                      onChange={(e) => setLangEnglish(e.target.checked)}
                    />
                    <span>English</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={langHindi}
                      onChange={(e) => setLangHindi(e.target.checked)}
                    />
                    <span>Hindi</span>
                  </label>
                </div>

                <div className="space-y-1 mt-1">
                  <Label
                    htmlFor="shop-price"
                    className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest"
                  >
                    Price Band
                  </Label>
                  <Input
                    id="shop-price"
                    placeholder="₹150-300"
                    className="h-9 rounded-xl text-xs font-semibold border-border bg-background"
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-primary dark:text-foreground">
                Verify Listing
              </span>
              <span className="text-[9px] text-muted-foreground">
                Only verified listings show in customer maps
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={verified}
                onChange={(e) => setVerified(e.target.checked)}
              />
              <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-safety-amber"></div>
            </label>
          </div>
        </div>

        {/* Right Side: Business Operation Hours */}
        <div className="md:col-span-5 flex flex-col gap-4 p-6 rounded-2xl border border-border bg-card/60 glassmorphism shadow-sm">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2">
            Operation Timetable
          </h3>

          <div className="flex flex-col gap-3">
            {daysOfWeek.map((day) => {
              const active = activeDays[day];
              const formatDay = day.charAt(0).toUpperCase() + day.slice(1);
              return (
                <div
                  key={day}
                  className="flex flex-col gap-1.5 pb-2 border-b border-border/40 last:border-b-0"
                >
                  <div className="flex justify-between items-center text-xs">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-primary dark:text-foreground">
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() => handleDayCheckboxChange(day)}
                        className="h-3.5 w-3.5 rounded border-border text-safety-amber focus:ring-safety-amber bg-background"
                      />
                      <span>{formatDay}</span>
                    </label>
                    <span
                      className={`text-[9px] font-black uppercase tracking-wider ${
                        active ? 'text-success' : 'text-muted-foreground/60'
                      }`}
                    >
                      {active ? 'Open' : 'Closed'}
                    </span>
                  </div>

                  {active && (
                    <div className="flex items-center gap-2 ml-5">
                      <Input
                        type="text"
                        placeholder="08:00"
                        className="h-8 rounded-lg text-center text-xs font-bold border-border bg-background py-1"
                        value={hoursOpen[day]}
                        onChange={(e) => handleTimeChange(day, 'open', e.target.value)}
                      />
                      <span className="text-[10px] font-semibold text-muted-foreground">to</span>
                      <Input
                        type="text"
                        placeholder="18:00"
                        className="h-8 rounded-lg text-center text-xs font-bold border-border bg-background py-1"
                        value={hoursClose[day]}
                        onChange={(e) => handleTimeChange(day, 'close', e.target.value)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <Button
            type="submit"
            disabled={saveLoading}
            className="w-full h-11 rounded-xl font-bold button-warning-gradient hover:opacity-90 active:scale-95 transition-all text-navy-dark mt-4"
          >
            {saveLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                <span>Saving Shop Listing...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1.5" />
                <span>Save Shop Listing</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

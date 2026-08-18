'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Loader2,
  MapPin,
  Compass,
  Plus,
  Trash2,
  Activity,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CityConfig {
  id: string;
  city_name: string;
  service_radius_km: number;
  launch_categories: string[];
  active: boolean;
}

export default function AdminCitiesPage() {
  const [cities, setCities] = useState<CityConfig[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);

  // Form states
  const [cityName, setCityName] = useState<string>('');
  const [radius, setRadius] = useState<string>('15.00');
  const [categories, setCategories] = useState<Record<string, boolean>>({
    tyre: true,
    battery: true,
    mechanic: true,
    fuel: false,
    towing: false,
    car_wash: false,
  });

  const fetchCities = async () => {
    setLoading(true);
    try {
      let dbSuccess = false;

      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
      ) {
        const { data, error } = await supabase
          .from('city_configurations')
          .select('*')
          .order('city_name', { ascending: true });

        if (!error && data) {
          setCities(data as CityConfig[]);
          dbSuccess = true;
        }
      }

      if (!dbSuccess) {
        setCities([
          {
            id: 'city-1',
            city_name: 'Kozhikode (Calicut)',
            service_radius_km: 15.0,
            launch_categories: ['tyre', 'battery', 'mechanic'],
            active: true,
          },
          {
            id: 'city-2',
            city_name: 'Kochi (Ernakulam)',
            service_radius_km: 20.0,
            launch_categories: ['tyre', 'towing', 'battery'],
            active: false,
          },
        ]);
      }
    } catch (err) {
      console.error('Error fetching city list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCities();
  }, []);

  const handleAddCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityName) return;

    setSaveLoading(true);
    try {
      let newId = `city-${Date.now()}`;
      const catsList = Object.keys(categories).filter((cat) => categories[cat]);
      const radVal = parseFloat(radius) || 15.0;

      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
      ) {
        const { data, error } = await supabase
          .from('city_configurations')
          .insert({
            city_name: cityName.trim(),
            service_radius_km: radVal,
            launch_categories: catsList,
            active: true,
          })
          .select('id')
          .single();

        if (data) newId = data.id;
      }

      setCities((prev) => [
        ...prev,
        {
          id: newId,
          city_name: cityName.trim(),
          service_radius_km: radVal,
          launch_categories: catsList,
          active: true,
        },
      ]);
      setCityName('');
      setRadius('15.00');
    } catch (err) {
      console.error('Add city configuration failed:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleToggleCity = async (cityId: string, currentActive: boolean) => {
    try {
      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
      ) {
        await supabase
          .from('city_configurations')
          .update({ active: !currentActive })
          .eq('id', cityId);
      }
      setCities((prev) =>
        prev.map((c) => (c.id === cityId ? { ...c, active: !currentActive } : c))
      );
    } catch (err) {
      console.error('Toggle failed:', err);
    }
  };

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 w-full max-w-5xl mx-auto">
      {/* Title */}
      <div className="flex flex-col border-b border-border/60 pb-4">
        <span className="text-[10px] font-black uppercase tracking-widest text-safety-amber">
          Super Admin Control console
        </span>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-primary dark:text-foreground font-sans">
          City configurations
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Add new launch cities, configure operational search radius thresholds, and enable/disable
          services.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left: Form */}
        <div className="md:col-span-5 flex flex-col gap-4 p-6 rounded-2xl border border-border bg-card/60 glassmorphism shadow-sm">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2 flex items-center gap-1.5">
            <Plus className="h-4 w-4 text-success" />
            <span>Launch New City</span>
          </h3>

          <form onSubmit={handleAddCity} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <Label
                htmlFor="city-name"
                className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
              >
                City Name *
              </Label>
              <Input
                id="city-name"
                placeholder="e.g. Kozhikode (Calicut)"
                value={cityName}
                onChange={(e) => setCityName(e.target.value)}
                className="h-10 rounded-xl text-xs font-semibold border-border bg-background"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="city-radius"
                className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
              >
                Service Radius (Km) *
              </Label>
              <Input
                id="city-radius"
                type="number"
                step="0.01"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                className="h-10 rounded-xl text-xs font-semibold border-border bg-background"
                required
              />
            </div>

            <div className="space-y-2 border-t border-border pt-3">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Launch Categories
              </Label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.keys(categories).map((cat) => (
                  <label
                    key={cat}
                    className="flex items-center gap-2 cursor-pointer font-semibold text-primary dark:text-foreground"
                  >
                    <input
                      type="checkbox"
                      checked={categories[cat]}
                      onChange={() => setCategories((prev) => ({ ...prev, [cat]: !prev[cat] }))}
                      className="rounded border-border text-safety-amber focus:ring-safety-amber"
                    />
                    <span className="capitalize">{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              disabled={saveLoading}
              className="w-full h-10 rounded-xl font-bold bg-success hover:bg-success/90 text-white active:scale-95 transition-all flex items-center justify-center gap-1.5 mt-2"
            >
              {saveLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              <span>Save Launch Settings</span>
            </Button>
          </form>
        </div>

        {/* Right: Table Lists */}
        <div className="md:col-span-7 flex flex-col gap-4 p-6 rounded-2xl border border-border bg-card/60 glassmorphism shadow-sm">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2 flex items-center gap-1.5">
            <Compass className="h-4 w-4 text-success" />
            <span>Launch City Configurations</span>
          </h3>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-7 w-7 animate-spin text-safety-amber" />
            </div>
          ) : cities.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground border border-dashed border-border rounded-xl">
              No cities registered.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {cities.map((city) => (
                <div
                  key={city.id}
                  className="p-4 rounded-xl border border-border bg-background/55 hover:border-muted-foreground/20 transition-all flex items-center justify-between gap-3 text-left"
                >
                  <div className="flex flex-col gap-1 text-xs">
                    <span className="font-bold text-primary dark:text-foreground text-sm">
                      {city.city_name}
                    </span>
                    <span className="text-muted-foreground font-semibold">
                      Service Radius: {city.service_radius_km} Km
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {city.launch_categories.map((c) => (
                        <span
                          key={c}
                          className="text-[7.5px] font-black uppercase tracking-wider border border-border bg-secondary/80 text-muted-foreground px-1.5 py-0.5 rounded"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleCity(city.id, city.active)}
                    className="p-1.5 rounded-lg border border-border text-muted-foreground active:scale-95 transition-all"
                  >
                    {city.active ? (
                      <ToggleRight className="h-7 w-7 text-success" />
                    ) : (
                      <ToggleLeft className="h-7 w-7 text-muted-foreground" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

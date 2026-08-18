'use client';

import React, { useState, useEffect } from 'react';
import { useWorker } from '../layout';
import { supabase } from '@/lib/supabase';
import { User, Phone, Truck, Save, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function WorkerProfilePage() {
  const { worker, refreshWorker } = useWorker();

  const [loading, setLoading] = useState<boolean>(false);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [vehicleType, setVehicleType] = useState<string>('');
  const [vehiclePlate, setVehiclePlate] = useState<string>('');

  const [selectedServices, setSelectedServices] = useState<Record<string, boolean>>({
    tyre: false,
    battery: false,
    mechanic: false,
    fuel: false,
    towing: false,
    car_wash: false,
  });
  const [pricing, setPricing] = useState<Record<string, string>>({
    tyre: '200',
    battery: '300',
    mechanic: '400',
    fuel: '150',
    towing: '1500',
    car_wash: '250',
  });

  // Pre-fill form fields
  useEffect(() => {
    if (!worker) return;

    const loadWorkerServices = async () => {
      setLoading(true);
      setName(worker.name);
      setPhone(worker.phone);
      setVehicleType(worker.vehicle_type || '');
      setVehiclePlate(worker.vehicle_plate || '');

      try {
        let dbSuccess = false;

        // 1. Fetch from Supabase
        if (
          process.env.NEXT_PUBLIC_SUPABASE_URL &&
          process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
        ) {
          const { data, error } = await supabase
            .from('worker_services')
            .select('category, base_price')
            .eq('worker_id', worker.id);

          if (!error && data) {
            dbSuccess = true;
            const updatedServices = { ...selectedServices };
            const updatedPricing = { ...pricing };

            data.forEach((s) => {
              updatedServices[s.category] = true;
              updatedPricing[s.category] = String(s.base_price);
            });

            setSelectedServices(updatedServices);
            setPricing(updatedPricing);
          }
        }

        // 2. Default mock pricing fallback if not in DB
        if (!dbSuccess) {
          // pre-select some categories for preview
          setSelectedServices({
            tyre: true,
            battery: true,
            mechanic: false,
            fuel: false,
            towing: false,
            car_wash: false,
          });
        }
      } catch (err) {
        console.error('Error fetching worker services:', err);
      } finally {
        setLoading(false);
      }
    };

    loadWorkerServices();
  }, [worker]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!worker) return;

    if (!name || !phone) {
      setError('Name and Phone fields are required.');
      return;
    }

    const noneSelected = Object.values(selectedServices).every((v) => !v);
    if (noneSelected) {
      setError('Please select at least one service category.');
      return;
    }

    setError(null);
    setSuccess(null);
    setSaveLoading(true);

    try {
      let dbSuccess = false;

      // 1. Update worker profile
      const workerPayload = {
        name: name.trim(),
        phone: phone.trim(),
        vehicle_type: vehicleType.trim() || null,
        vehicle_plate: vehiclePlate.trim() || null,
      };

      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
      ) {
        const { error: workerError } = await supabase
          .from('workers')
          .update(workerPayload)
          .eq('id', worker.id);

        if (!workerError) {
          dbSuccess = true;

          // 2. Update services
          await supabase.from('worker_services').delete().eq('worker_id', worker.id);

          const servicesPayload = Object.keys(selectedServices)
            .filter((cat) => selectedServices[cat])
            .map((cat) => ({
              worker_id: worker.id,
              category: cat,
              base_price: parseFloat(pricing[cat]) || 0,
            }));

          if (servicesPayload.length > 0) {
            await supabase.from('worker_services').insert(servicesPayload);
          }
        }
      }

      await refreshWorker();
      setSuccess('Service profile updated successfully.');
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(err.message || 'Could not save profile details.');
    } finally {
      setSaveLoading(false);
    }
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
      <div className="w-full h-full flex flex-col items-center justify-center py-24 text-muted-foreground bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-safety-amber mb-4" />
        <span className="text-sm font-semibold">Loading profile parameters...</span>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 w-full max-w-4xl mx-auto">
      {/* Title */}
      <div className="flex flex-col">
        <span className="text-[10px] font-black uppercase tracking-widest text-success">
          Verified Partner Settings
        </span>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-primary dark:text-foreground font-sans">
          Service Profile
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Edit active categories, adjust service call charges, and update vehicle records.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive text-center font-semibold">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-xs text-success text-center font-semibold">
          {success}
        </div>
      )}

      {/* Form Details */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Side: General Profile Info */}
        <div className="md:col-span-7 flex flex-col gap-5 p-6 rounded-2xl border border-border bg-card/60 glassmorphism shadow-sm">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2">
            Mechanic details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="prof-name"
                className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
              >
                Full Name *
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="prof-name"
                  placeholder="Rasheed P. K."
                  className="pl-9 h-10 rounded-xl text-xs font-semibold border-border bg-background"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="prof-phone"
                className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
              >
                Contact Phone *
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="prof-phone"
                  placeholder="9876543210"
                  className="pl-9 h-10 rounded-xl text-xs font-semibold border-border bg-background"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="prof-vtype"
                className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
              >
                Vehicle Type
              </Label>
              <div className="relative">
                <Truck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="prof-vtype"
                  placeholder="Bolero Camper"
                  className="pl-9 h-10 rounded-xl text-xs font-semibold border-border bg-background"
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="prof-vplate"
                className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
              >
                Vehicle Plate
              </Label>
              <Input
                id="prof-vplate"
                placeholder="KL-11-Z-9988"
                className="h-10 rounded-xl text-xs font-semibold border-border bg-background"
                value={vehiclePlate}
                onChange={(e) => setVehiclePlate(e.target.value)}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={saveLoading}
            className="w-full h-11 rounded-xl font-bold bg-success hover:bg-success/90 text-white active:scale-95 transition-all mt-4 flex items-center justify-center gap-1.5"
          >
            {saveLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Profile Settings</span>
              </>
            )}
          </Button>
        </div>

        {/* Right Side: Services Pricing Form */}
        <div className="md:col-span-5 flex flex-col gap-4 p-6 rounded-2xl border border-border bg-card/60 glassmorphism shadow-sm">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2">
            Active Categories
          </h3>

          <div className="flex flex-col gap-3">
            {Object.keys(selectedServices).map((cat) => {
              const checked = selectedServices[cat];
              return (
                <div
                  key={cat}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                    checked ? 'border-success bg-success/5' : 'border-border bg-background/25'
                  }`}
                >
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-primary dark:text-foreground pl-1">
                    <input
                      type="checkbox"
                      checked={checked}
                      className="h-4 w-4 rounded border-border text-success focus:ring-success bg-background"
                      onChange={() =>
                        setSelectedServices((prev) => ({ ...prev, [cat]: !prev[cat] }))
                      }
                    />
                    <span>{getCategoryLabel(cat)}</span>
                  </label>

                  {checked && (
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-muted-foreground font-bold">₹</span>
                      <Input
                        type="number"
                        className="h-8 w-20 text-center font-bold text-xs rounded-lg border-border"
                        value={pricing[cat]}
                        onChange={(e) => setPricing((prev) => ({ ...prev, [cat]: e.target.value }))}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </form>
    </div>
  );
}

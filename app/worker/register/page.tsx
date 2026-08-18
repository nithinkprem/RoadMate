'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useWorker } from '../layout';
import { supabase } from '@/lib/supabase';
import {
  User,
  Phone,
  Truck,
  MapPin,
  FileText,
  Loader2,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function WorkerRegisterPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Steps: W1 = Identity, W2 = Services & Pricing, W3 = Documents & Location
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // --- FORM STATES ---
  // W1 Identity
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [vehicleType, setVehicleType] = useState<string>('');
  const [vehiclePlate, setVehiclePlate] = useState<string>('');

  // W2 Services (toggles + pricing)
  const [selectedServices, setSelectedServices] = useState<Record<string, boolean>>({
    tyre: true,
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

  // W3 Documents & Base Location
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState<string>('');
  const [lat, setLat] = useState<string>('11.2588'); // Calicut center default
  const [lng, setLng] = useState<string>('75.7804');
  const [resolvingGps, setResolvingGps] = useState<boolean>(false);

  // Load progress from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('knive_worker_reg_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        setName(parsed.name || '');
        setPhone(parsed.phone || '');
        setVehicleType(parsed.vehicleType || '');
        setVehiclePlate(parsed.vehiclePlate || '');
        setSelectedServices(parsed.selectedServices || { tyre: true });
        setPricing(parsed.pricing || {});
        setLat(parsed.lat || '11.2588');
        setLng(parsed.lng || '75.7804');
      } else if (user) {
        // Pre-fill from user account
        setName(user.name || '');
        setPhone(user.phone || '');
      }
    } catch (e) {
      console.error('Error loading draft: ', e);
    }
  }, [user]);

  // Save progress to localStorage when states change
  useEffect(() => {
    const draft = {
      name,
      phone,
      vehicleType,
      vehiclePlate,
      selectedServices,
      pricing,
      lat,
      lng,
    };
    localStorage.setItem('knive_worker_reg_draft', JSON.stringify(draft));
  }, [name, phone, vehicleType, vehiclePlate, selectedServices, pricing, lat, lng]);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (step === 1) {
      if (!name || !phone) {
        setError('Name and Phone Number are required.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      // Check if at least one service is selected
      const noneSelected = Object.values(selectedServices).every((v) => !v);
      if (noneSelected) {
        setError('Please select at least one service category.');
        return;
      }
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    setError(null);
    setStep((prev) => Math.max(1, prev - 1));
  };

  // Get current browser coordinates for worker base
  const handleResolveBaseLocation = () => {
    setResolvingGps(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation not supported by browser.');
      setResolvingGps(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setResolvingGps(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        setError('Could not fetch GPS coordinates automatically.');
        setResolvingGps(false);
      },
      { timeout: 8000 }
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (Max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Document file size exceeds 5MB limit.');
      setDocumentFile(null);
      setDocumentName('');
      return;
    }

    setDocumentFile(file);
    setDocumentName(file.name);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!documentFile) {
      setError('Please upload a PDF or image copy of your vehicle service license or ID.');
      return;
    }

    const latVal = parseFloat(lat);
    const lngVal = parseFloat(lng);
    if (isNaN(latVal) || isNaN(lngVal)) {
      setError('Latitude and Longitude coordinates must be valid numbers.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      let documentUrl = 'mock-document-url.pdf';
      let dbSuccess = false;

      // 1. Upload to Supabase Storage if credentials configured
      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
      ) {
        const fileExt = documentFile.name.split('.').pop();
        const filePath = `${user.id}/document_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('worker-documents')
          .upload(filePath, documentFile, { upsert: true });

        if (!uploadError) {
          // Get signed URL
          const { data: signedData, error: signedError } = await supabase.storage
            .from('worker-documents')
            .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year

          if (!signedError && signedData) {
            documentUrl = signedData.signedUrl;
          }
        } else {
          console.error('Document upload error:', uploadError.message);
        }
      }

      // 2. Insert/Update user profile role to 'worker'
      const { error: roleError } = await supabase
        .from('users')
        .update({ role: 'worker' })
        .eq('id', user.id);

      if (roleError) console.error('Error upgrading user role:', roleError.message);

      // 3. Insert Worker profile record
      const workerPayload = {
        id: user.id,
        name: name.trim(),
        phone: phone.trim(),
        base_latitude: latVal,
        base_longitude: lngVal,
        vehicle_type: vehicleType.trim() || null,
        vehicle_plate: vehiclePlate.trim() || null,
        verification_status: 'pending',
      };

      const { error: workerError } = await supabase.from('workers').upsert(workerPayload);

      if (!workerError) {
        dbSuccess = true;

        // 4. Insert Worker Services
        // Delete existing services first (if any)
        await supabase.from('worker_services').delete().eq('worker_id', user.id);

        const servicesPayload = Object.keys(selectedServices)
          .filter((cat) => selectedServices[cat])
          .map((cat) => ({
            worker_id: user.id,
            category: cat,
            base_price: parseFloat(pricing[cat]) || 0,
          }));

        if (servicesPayload.length > 0) {
          const { error: servicesError } = await supabase
            .from('worker_services')
            .insert(servicesPayload);

          if (servicesError) {
            console.error('Error inserting worker services:', servicesError.message);
          }
        }
      }

      // Clear draft storage
      localStorage.removeItem('knive_worker_reg_draft');
      setLoading(false);

      // Refresh window session to force update role context
      window.location.href = '/worker/pending';
    } catch (err: any) {
      console.error('Registration failed:', err);
      setError(err.message || 'Worker registration failed. Please try again.');
      setLoading(false);
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

  return (
    <div className="flex-1 w-full bg-background flex items-center justify-center py-12 px-4">
      {/* Background accents */}
      <div className="absolute top-[-5%] left-[-5%] w-[45%] h-[45%] rounded-full bg-success/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[500px] rounded-2xl border border-border bg-card shadow-2xl glassmorphism p-8 flex flex-col gap-6 relative">
        <div className="flex flex-col items-center text-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-success mb-1">
            Knive Service Network
          </span>
          <h1 className="text-2xl font-black tracking-tight text-primary dark:text-foreground font-sans">
            Worker Registration
          </h1>
          {/* Progress Indicators */}
          <div className="flex items-center gap-2 mt-4">
            <span
              className={`h-2.5 w-8 rounded-full transition-colors ${step >= 1 ? 'bg-success' : 'bg-secondary'}`}
            />
            <span
              className={`h-2.5 w-8 rounded-full transition-colors ${step >= 2 ? 'bg-success' : 'bg-secondary'}`}
            />
            <span
              className={`h-2.5 w-8 rounded-full transition-colors ${step >= 3 ? 'bg-success' : 'bg-secondary'}`}
            />
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive text-center font-semibold">
            {error}
          </div>
        )}

        {/* STEP 1: IDENTITY */}
        {step === 1 && (
          <form onSubmit={handleNextStep} className="space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-1">
              Step 1: Partner Details
            </h3>

            <div className="space-y-2">
              <Label
                htmlFor="reg-name"
                className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
              >
                Full Name *
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reg-name"
                  placeholder="Rasheed P. K."
                  className="pl-9 h-11 rounded-xl text-xs font-semibold border-border bg-background"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="reg-phone"
                className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
              >
                Contact Phone *
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reg-phone"
                  placeholder="9876543210"
                  className="pl-9 h-11 rounded-xl text-xs font-semibold border-border bg-background"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="reg-vtype"
                  className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                >
                  Vehicle Type
                </Label>
                <div className="relative">
                  <Truck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reg-vtype"
                    placeholder="Pickup Van"
                    className="pl-9 h-11 rounded-xl text-xs font-semibold border-border bg-background"
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="reg-vplate"
                  className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
                >
                  Vehicle Plate
                </Label>
                <Input
                  id="reg-vplate"
                  placeholder="KL-11-AA-1234"
                  className="h-11 rounded-xl text-xs font-semibold border-border bg-background"
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value)}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 rounded-xl font-bold bg-success hover:bg-success/90 text-white active:scale-95 transition-all flex items-center justify-center gap-1.5 mt-2"
            >
              <span>Next: Services & Pricing</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        )}

        {/* STEP 2: SERVICES & PRICING */}
        {step === 2 && (
          <form onSubmit={handleNextStep} className="space-y-5">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-1">
              Step 2: Services & pricing
            </h3>

            <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
              {Object.keys(selectedServices).map((cat) => {
                const checked = selectedServices[cat];
                return (
                  <div
                    key={cat}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                      checked ? 'border-success bg-success/5' : 'border-border bg-background/25'
                    }`}
                  >
                    <label className="flex items-center gap-2.5 cursor-pointer font-bold text-xs text-primary dark:text-foreground">
                      <input
                        type="checkbox"
                        checked={checked}
                        className="h-4.5 w-4.5 rounded border-border text-success focus:ring-success bg-background"
                        onChange={() =>
                          setSelectedServices((prev) => ({ ...prev, [cat]: !prev[cat] }))
                        }
                      />
                      <span>{getCategoryLabel(cat)}</span>
                    </label>

                    {checked && (
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground font-bold">Base ₹</span>
                        <Input
                          type="number"
                          className="h-8 w-20 text-center font-bold text-xs rounded-lg border-border"
                          value={pricing[cat]}
                          onChange={(e) =>
                            setPricing((prev) => ({ ...prev, [cat]: e.target.value }))
                          }
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                onClick={handlePrevStep}
                variant="secondary"
                className="flex-1 h-11 rounded-xl font-bold border border-border flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              <Button
                type="submit"
                className="flex-1 h-11 rounded-xl font-bold bg-success hover:bg-success/90 text-white active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <span>Next: Verify</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </form>
        )}

        {/* STEP 3: DOCUMENTS & LOCATION */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-1">
              Step 3: Documents & location
            </h3>

            {/* Document Upload */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <FileText className="h-4 w-4 text-success" />
                <span>Upload License / ID Copy *</span>
              </Label>
              <div className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center bg-background/30 text-center relative hover:bg-background/50 transition-colors">
                <input
                  type="file"
                  accept=".pdf,image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                />
                <span className="text-xs font-bold text-primary dark:text-foreground">
                  {documentName || 'Choose file or drag here'}
                </span>
                <span className="text-[10px] text-muted-foreground mt-1">
                  PDF or image format, max 5MB
                </span>
              </div>
            </div>

            {/* Location coordinates */}
            <div className="space-y-2 border-t border-border pt-4">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-success" />
                  <span>Base Location coordinates</span>
                </Label>
                <button
                  type="button"
                  onClick={handleResolveBaseLocation}
                  disabled={resolvingGps}
                  className="text-[10px] text-success font-bold hover:underline"
                >
                  {resolvingGps ? 'Locating...' : 'Get GPS Coordinates'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Latitude"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  className="h-10 rounded-xl text-xs font-semibold border-border bg-background"
                  required
                />
                <Input
                  placeholder="Longitude"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  className="h-10 rounded-xl text-xs font-semibold border-border bg-background"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                onClick={handlePrevStep}
                variant="secondary"
                className="flex-1 h-11 rounded-xl font-bold border border-border flex items-center justify-center gap-1.5"
                disabled={loading}
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 h-11 rounded-xl font-bold bg-success hover:bg-success/90 text-white active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Registering...</span>
                  </>
                ) : (
                  <>
                    <span>Finish Register</span>
                    <CheckCircle className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

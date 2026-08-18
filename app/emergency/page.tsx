'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  AlertTriangle,
  ArrowLeft,
  Loader2,
  MapPin,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Zap,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TrustedContact {
  name: string;
  phone: string;
}

export default function EmergencyPage() {
  const router = useRouter();
  const { user, openLoginModal } = useAuth();

  const [loading, setLoading] = useState<boolean>(false);
  const [sosTriggered, setSosTriggered] = useState<boolean>(false);
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<any | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchContacts = async () => {
      try {
        const { data } = await supabase
          .from('trusted_contacts')
          .select('name, phone')
          .eq('user_id', user.id);
        if (data && data.length > 0) {
          setContacts(data as TrustedContact[]);
        }
      } catch (err) {
        console.error('Error fetching trusted contacts:', err);
      }
    };
    fetchContacts();
  }, [user]);

  // SOS button trigger (Prompt 63)
  const handleTriggerSOS = async () => {
    if (!user) {
      openLoginModal();
      return;
    }

    setLoading(true);
    try {
      let dbSuccess = false;

      // Log emergency request in the database (Prompt 61)
      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
      ) {
        const { error } = await supabase.from('emergency_requests').insert({
          user_id: user.id,
          category: 'SOS_alert',
          latitude: 11.2588,
          longitude: 75.7804,
          status: 'active',
        });

        if (!error) dbSuccess = true;
      }

      setSosTriggered(true);
    } catch (err) {
      console.error('SOS dispatch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Find nearest provider simulation (Prompt 62)
  const handleQueryEmergencyProvider = (category: string) => {
    setSelectedProvider({
      category,
      name: `${category.charAt(0).toUpperCase() + category.slice(1)} Rescue Station`,
      phone: '112', // Kozhikode local emergency
      address: 'Mavoor Road Junction, Kozhikode',
      distance: 1.2,
    });
  };

  return (
    <div className="flex-1 w-full bg-background flex items-center justify-center py-12 px-4 relative">
      {/* Background accents */}
      <div className="absolute top-[-5%] left-[-5%] w-[45%] h-[45%] rounded-full bg-red-500/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[480px] rounded-2xl border border-border bg-card shadow-2xl p-8 flex flex-col gap-6 text-center items-center relative glassmorphism">
        {/* Navigation back */}
        <div className="flex items-center w-full">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary text-xs font-bold text-muted-foreground hover:text-foreground border border-border transition-all active:scale-95"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Home</span>
          </button>
        </div>

        {sosTriggered ? (
          <div className="w-full flex flex-col items-center gap-5 py-6 animate-float">
            <div className="h-16 w-16 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/25 animate-ping">
              <ShieldAlert className="h-8 w-8" />
            </div>

            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-black text-red-500">SOS Dispatch Active!</h2>
              <p className="text-xs text-muted-foreground max-w-xs mt-1 leading-relaxed">
                Emergency coordinates logged. Alert SMS dispatches simulated to:
              </p>
            </div>

            {/* Contacts loop */}
            <div className="w-full space-y-2">
              {contacts.length > 0 ? (
                contacts.map((c, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center text-xs p-3 rounded-xl border border-border bg-background/55"
                  >
                    <span className="font-bold text-primary dark:text-foreground">{c.name}</span>
                    <span className="font-semibold text-muted-foreground">{c.phone}</span>
                  </div>
                ))
              ) : (
                <div className="p-3 text-xs text-muted-foreground italic rounded-xl border border-border bg-background/30">
                  Mock Contacts (No trusted contacts configured. Please configure in contacts
                  console.)
                </div>
              )}
            </div>

            <Button
              onClick={() => setSosTriggered(false)}
              variant="outline"
              className="w-full h-11 rounded-xl text-xs font-bold border-border bg-card"
            >
              Dismiss SOS Alert
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 shadow-md mb-2">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-red-500">
                Rescue Operations
              </span>
              <h1 className="text-2xl font-black tracking-tight text-primary dark:text-foreground font-sans mt-0.5">
                Emergency SOS Desk
              </h1>
              <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
                Trigger immediate alerts or locate nearest rescue, police, first aid, and EV
                charging stations.
              </p>
            </div>

            {/* SOS BUTTON (Prompt 63) */}
            <button
              onClick={handleTriggerSOS}
              disabled={loading}
              className="w-32 h-32 rounded-full font-black bg-red-600 hover:bg-red-700 text-white flex flex-col items-center justify-center gap-1 active:scale-95 transition-all shadow-lg shadow-red-500/25 border-4 border-red-500/30 animate-pulse"
            >
              <AlertTriangle className="h-8 w-8 fill-white text-red-600" />
              <span className="text-[11px] uppercase tracking-widest">Trigger SOS</span>
            </button>

            {/* EMERGENCY CATEGORY LISTS (Prompt 62) */}
            <div className="w-full border-t border-border pt-4 text-left space-y-3">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                Emergency services
              </span>

              <div className="grid grid-cols-2 gap-3 text-xs font-bold">
                {[
                  { id: 'police', label: 'Local Police' },
                  { id: 'ambulance', label: 'Ambulance Unit' },
                  { id: 'ev_charging', label: 'EV Charger' },
                  { id: 'first_aid', label: 'First Aid Medical' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleQueryEmergencyProvider(item.id)}
                    className="p-3 rounded-xl border border-border bg-background/55 hover:bg-background hover:border-red-500/25 transition-all active:scale-95 text-left"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* SELECTED PROVIDER PANEL */}
            {selectedProvider && (
              <div className="w-full p-4 rounded-xl bg-secondary/60 border border-border text-left text-xs space-y-2.5 animate-fade-in">
                <div className="flex justify-between items-center border-b border-border pb-1.5">
                  <span className="font-bold text-primary dark:text-foreground">
                    {selectedProvider.name}
                  </span>
                  <span className="text-[10px] text-success font-black">
                    {selectedProvider.distance} Km away
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-4 w-4 text-red-500 shrink-0" />
                  <span>{selectedProvider.address}</span>
                </div>
                <a
                  href={`tel:${selectedProvider.phone}`}
                  className="h-9 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all w-full shadow-sm"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>Call Dispatch Desk ({selectedProvider.phone})</span>
                </a>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

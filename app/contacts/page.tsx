'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  Users,
  Trash2,
  Plus,
  Loader2,
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  Phone,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Contact {
  id: string;
  name: string;
  phone: string;
}

export default function ContactsPage() {
  const router = useRouter();
  const { user, openLoginModal } = useAuth();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);

  // Form states
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let dbSuccess = false;

      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
      ) {
        const { data, error } = await supabase
          .from('trusted_contacts')
          .select('*')
          .eq('user_id', user.id);

        if (!error && data) {
          setContacts(data as Contact[]);
          dbSuccess = true;
        }
      }

      if (!dbSuccess) {
        setContacts([
          { id: 'contact-1', name: 'Aswathy Nair', phone: '9876543230' },
          { id: 'contact-2', name: 'Jithin Mavoor', phone: '9876543231' },
        ]);
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      openLoginModal();
      return;
    }
    fetchContacts();
  }, [user]);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name || !phone) return;

    setError(null);
    setSaveLoading(true);

    try {
      let newId = `contact-${Date.now()}`;
      let dbSuccess = false;

      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
      ) {
        const { data, error } = await supabase
          .from('trusted_contacts')
          .insert({
            user_id: user.id,
            name: name.trim(),
            phone: phone.trim(),
          })
          .select('id')
          .single();

        if (!error && data) {
          newId = data.id;
          dbSuccess = true;
        } else {
          setError(error?.message || 'Error inserting contact.');
        }
      }

      setContacts((prev) => [...prev, { id: newId, name: name.trim(), phone: phone.trim() }]);
      setName('');
      setPhone('');
    } catch (err) {
      console.error('Add contact failed:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    try {
      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
      ) {
        await supabase.from('trusted_contacts').delete().eq('id', contactId);
      }
      setContacts((prev) => prev.filter((c) => c.id !== contactId));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  if (!user) {
    return (
      <div className="flex-1 w-full flex flex-col items-center justify-center py-20 text-center px-4">
        <ShieldCheck className="h-10 w-10 text-muted-foreground mb-3 animate-pulse" />
        <span className="text-sm font-bold text-primary dark:text-foreground mb-1">
          Access Restrained
        </span>
        <p className="text-xs text-muted-foreground max-w-xs mb-4">
          Please log in to manage your emergency trusted contacts.
        </p>
        <Button
          onClick={openLoginModal}
          className="button-warning-gradient rounded-xl text-navy-dark px-6 font-bold"
        >
          Login Account
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center py-24 text-muted-foreground bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-safety-amber mb-4" />
        <span className="text-sm font-semibold">Compiling contacts desk...</span>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 w-full max-w-4xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-border/60 pb-4">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-widest text-safety-amber">
            Safety Circle Manager
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-primary dark:text-foreground font-sans">
            Trusted Contacts
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Add contacts who will receive emergency notifications and live coordinates tracking
            route links during breakdowns.
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
        {/* Left column: Add contacts Form */}
        <div className="md:col-span-5 flex flex-col gap-4 p-6 rounded-2xl border border-border bg-card/60 glassmorphism shadow-sm">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2 flex items-center gap-1.5">
            <Plus className="h-4 w-4 text-success" />
            <span>Add New Contact</span>
          </h3>

          {error && (
            <div className="p-2.5 rounded bg-destructive/10 border border-destructive/20 text-[10px] font-semibold text-destructive text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleAddContact} className="space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="contact-name"
                className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
              >
                Contact Name *
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="contact-name"
                  placeholder="e.g. Aswathy Nair"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-9 h-10 rounded-xl text-xs font-semibold border-border bg-background"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="contact-phone"
                className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
              >
                Mobile Number *
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="contact-phone"
                  placeholder="e.g. 9876543230"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-9 h-10 rounded-xl text-xs font-semibold border-border bg-background"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={saveLoading}
              className="w-full h-10 rounded-xl font-bold bg-success hover:bg-success/90 text-white active:scale-95 transition-all flex items-center justify-center gap-1"
            >
              {saveLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              <span>Save Contact Details</span>
            </Button>
          </form>
        </div>

        {/* Right column: list contacts */}
        <div className="md:col-span-7 flex flex-col gap-4 p-6 rounded-2xl border border-border bg-card/60 glassmorphism shadow-sm">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2 flex items-center gap-1.5">
            <Users className="h-4 w-4 text-success" />
            <span>Your Safety Circle</span>
          </h3>

          {contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground/60 border border-dashed border-border rounded-xl">
              <Users className="h-8 w-8 text-muted-foreground/40 mb-2 animate-pulse" />
              <span className="text-xs font-bold">No contacts stored.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {contacts.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-xl border border-border bg-background/55 hover:border-muted-foreground/20 transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex flex-col text-xs text-left">
                    <span className="font-bold text-primary dark:text-foreground text-sm">
                      {c.name}
                    </span>
                    <span className="text-muted-foreground mt-0.5 font-semibold">{c.phone}</span>
                  </div>

                  <button
                    onClick={() => handleDeleteContact(c.id)}
                    className="p-2 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/20 active:scale-95 transition-all"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
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

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  MapPin,
  Edit2,
  EyeOff,
  Check,
  X,
  Loader2,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { Shop } from '@/types';

// Mock list matching the other fallbacks
const MOCK_SHOPS: Shop[] = [
  {
    id: 'mock-shop-1',
    name: 'Calicut Tyre Hub & Puncture Clinic',
    owner_name: 'Rasheed P. K.',
    phone: '9876543210',
    category: 'tyre',
    latitude: 11.2588,
    longitude: 75.7804,
    address: 'Mavoor Road, Near KSRTC Stand, Calicut',
    hours_json: { regular: {} },
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
    owner_name: 'Siddique Ali',
    phone: '9876543211',
    category: 'battery',
    latitude: 11.2612,
    longitude: 75.7845,
    address: 'Link Road, Kozhikode',
    hours_json: { regular: {} },
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
    owner_name: 'Vikraman P.',
    phone: '9876543212',
    category: 'mechanic',
    latitude: 11.2545,
    longitude: 75.7721,
    address: 'Palayam, Calicut',
    hours_json: { regular: {} },
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
    owner_name: 'Biju Calicut',
    phone: '9876543213',
    category: 'towing',
    latitude: 11.2721,
    longitude: 75.7951,
    address: 'Bypass Road, Calicut',
    hours_json: { regular: {} },
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
];

export default function AdminListingsPage() {
  const router = useRouter();

  const [shops, setShops] = useState<Shop[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const fetchShops = async () => {
      setLoading(true);
      try {
        let dbSuccess = false;

        // 1. Query Supabase
        if (
          process.env.NEXT_PUBLIC_SUPABASE_URL &&
          process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
        ) {
          const { data, error } = await supabase
            .from('shops')
            .select('*')
            .order('created_at', { ascending: false });

          if (!error && data) {
            setShops(data as Shop[]);
            dbSuccess = true;
          }
        }

        // 2. Fallback to Mock Shops
        if (!dbSuccess) {
          setShops(MOCK_SHOPS);
        }
      } catch (err) {
        console.error('Error fetching shops list:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchShops();
  }, []);

  // Action: Toggle verified status
  const handleToggleVerify = async (shopId: string, currentStatus: boolean) => {
    setActionLoading(shopId);
    try {
      let dbSuccess = false;

      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
      ) {
        const { error } = await supabase
          .from('shops')
          .update({ verified: !currentStatus })
          .eq('id', shopId);

        if (!error) dbSuccess = true;
      }

      setShops((prev) =>
        prev.map((s) => (s.id === shopId ? { ...s, verified: !currentStatus } : s))
      );
    } catch (err) {
      console.error('Error toggling shop verification:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Action: Delete shop listing
  const handleDeleteShop = async (shopId: string) => {
    if (!confirm('Are you sure you want to delete this shop permanently?')) return;

    setActionLoading(shopId);
    try {
      let dbSuccess = false;

      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
      ) {
        const { error } = await supabase.from('shops').delete().eq('id', shopId);

        if (!error) dbSuccess = true;
      }

      setShops((prev) => prev.filter((s) => s.id !== shopId));
    } catch (err) {
      console.error('Error deleting shop:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredShops = shops.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.owner_name && s.owner_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
        <span className="text-sm font-semibold">Loading Calicut directory...</span>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-widest text-safety-amber">
            Directory Management
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-primary dark:text-foreground font-sans">
            Calicut Shop Directory
          </h1>
        </div>

        <Button
          onClick={() => router.push('/admin/listings/new')}
          className="rounded-xl font-bold button-warning-gradient hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1.5 h-11 text-navy-dark px-5"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Add New Shop</span>
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by name, owner or landmark..."
          className="pl-10 h-11 rounded-xl text-xs font-semibold border-border focus:border-safety-amber focus:ring-1 focus:ring-safety-amber bg-card/40"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* LISTINGS TABLE */}
      {filteredShops.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center p-6 border border-dashed border-border rounded-2xl bg-card/30">
          <AlertCircle className="h-10 w-10 text-muted-foreground mb-3 animate-pulse" />
          <span className="text-sm font-bold text-primary dark:text-foreground mb-1">
            No Listings Found
          </span>
          <p className="text-xs text-muted-foreground max-w-xs">
            No shops match the query &ldquo;{searchTerm}&rdquo;. Try using different keywords.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card/50 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/80 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Shop Details</th>
                  <th className="p-4">Owner / Contact</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Verified</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredShops.map((shop) => {
                  const isProcessing = actionLoading === shop.id;
                  return (
                    <tr key={shop.id} className="hover:bg-secondary/25 transition-colors">
                      <td className="p-4 flex flex-col gap-0.5">
                        <span className="font-bold text-primary dark:text-foreground text-sm tracking-tight">
                          {shop.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <MapPin className="h-3 w-3" />
                          {shop.address}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-primary dark:text-foreground">
                            {shop.owner_name || 'N/A'}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{shop.phone}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold bg-secondary text-secondary-foreground border border-border">
                          {getCategoryLabel(shop.category)}
                        </span>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleVerify(shop.id, shop.verified)}
                          disabled={isProcessing}
                          className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border transition-all ${
                            shop.verified
                              ? 'bg-success/10 text-success border-success/30 hover:bg-success/20'
                              : 'bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20'
                          }`}
                        >
                          {shop.verified ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                          <span>{shop.verified ? 'Verified' : 'Pending'}</span>
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => router.push(`/admin/listings/${shop.id}/edit`)}
                            disabled={isProcessing}
                            variant="outline"
                            size="sm"
                            className="p-2 h-8 w-8 rounded-lg border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            onClick={() => handleDeleteShop(shop.id)}
                            disabled={isProcessing}
                            variant="outline"
                            size="sm"
                            className="p-2 h-8 w-8 rounded-lg border-destructive/20 hover:bg-destructive/10 text-destructive transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

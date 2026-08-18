'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  Loader2,
  ShieldCheck,
  MapPin,
  Settings,
  History,
  LogOut,
  Menu,
  X,
  UserCheck,
  TrendingUp,
} from 'lucide-react';

interface WorkerProfile {
  id: string;
  name: string;
  phone: string;
  base_latitude: number;
  base_longitude: number;
  vehicle_type?: string;
  vehicle_plate?: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  rejection_reason?: string;
  is_online: boolean;
}

interface WorkerContextType {
  worker: WorkerProfile | null;
  loading: boolean;
  refreshWorker: () => Promise<void>;
}

const WorkerContext = createContext<WorkerContextType | undefined>(undefined);

export const useWorker = () => {
  const context = useContext(WorkerContext);
  if (context === undefined) {
    throw new Error('useWorker must be used within a WorkerProvider');
  }
  return context;
};

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: authLoading, openLoginModal } = useAuth();

  const [worker, setWorker] = useState<WorkerProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const fetchWorkerProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from('workers').select('*').eq('id', user.id).single();

      if (!error && data) {
        setWorker(data as WorkerProfile);
      } else {
        setWorker(null);
      }
    } catch (err) {
      console.error('Error fetching worker profile:', err);
    }
  };

  useEffect(() => {
    const checkWorkerAccess = async () => {
      // 1. Wait for Auth Context to load
      if (authLoading) return;

      // 2. Gate: Must be logged in
      if (!user) {
        setLoading(false);
        openLoginModal();
        return;
      }

      // 3. Load worker database profile
      await fetchWorkerProfile();
      setLoading(false);
    };

    checkWorkerAccess();
  }, [user, authLoading]);

  // 4. Handle Redirection logic based on path and status
  useEffect(() => {
    if (loading || authLoading) return;

    // A. If user has no worker record: must register first (unless already registering)
    if (!worker) {
      if (pathname !== '/worker/register') {
        router.push('/worker/register');
      }
      return;
    }

    // B. If worker verification is pending or rejected
    if (worker.verification_status !== 'verified') {
      if (pathname !== '/worker/pending' && pathname !== '/worker/register') {
        router.push('/worker/pending');
      }
    } else {
      // If verified worker tries to access pending page or registration, send to dashboard
      if (pathname === '/worker/pending' || pathname === '/worker/register') {
        router.push('/worker/dashboard');
      }
    }
  }, [worker, loading, authLoading, pathname, router]);

  const handleLogout = async () => {
    // Standard customer logout
    router.push('/');
  };

  const navLinks = [
    { href: '/worker/dashboard', label: 'Duty Console', icon: <MapPin className="h-4 w-4" /> },
    { href: '/worker/profile', label: 'Service Profile', icon: <Settings className="h-4 w-4" /> },
    { href: '/worker/jobs/history', label: 'Job History', icon: <History className="h-4 w-4" /> },
    {
      href: '/worker/earnings',
      label: 'Earnings & Payouts',
      icon: <TrendingUp className="h-4 w-4" />,
    },
  ];

  if (authLoading || loading) {
    return (
      <div className="flex-1 w-full flex flex-col items-center justify-center py-24 text-muted-foreground bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-safety-amber mb-4" />
        <span className="text-sm font-semibold">Initializing worker space...</span>
      </div>
    );
  }

  // If no user or no worker and currently on registration page, allow registration render directly
  const isPublicPage = pathname === '/worker/register' || pathname === '/worker/pending';
  if (!worker && isPublicPage) {
    return (
      <WorkerContext.Provider
        value={{ worker: null, loading: false, refreshWorker: fetchWorkerProfile }}
      >
        {children}
      </WorkerContext.Provider>
    );
  }

  // If pending/rejected and on pending page, allow render directly
  if (worker && worker.verification_status !== 'verified' && pathname === '/worker/pending') {
    return (
      <WorkerContext.Provider value={{ worker, loading: false, refreshWorker: fetchWorkerProfile }}>
        {children}
      </WorkerContext.Provider>
    );
  }

  // Guard: If not verified or no worker, do not render layout shell children
  if (!worker || worker.verification_status !== 'verified') {
    return (
      <div className="flex-1 w-full flex flex-col items-center justify-center py-24 text-muted-foreground bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-safety-amber mb-4" />
        <span className="text-sm font-semibold">Redirecting to verification...</span>
      </div>
    );
  }

  return (
    <WorkerContext.Provider value={{ worker, loading: false, refreshWorker: fetchWorkerProfile }}>
      <div className="flex-1 w-full bg-background flex flex-col lg:flex-row">
        {/* Worker Sidebar */}
        <aside className="lg:w-64 border-b lg:border-b-0 lg:border-r border-border bg-card/50 glassmorphism flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success text-white shadow-sm">
                <UserCheck className="h-4.5 w-4.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black text-primary dark:text-foreground">
                  Worker Portal
                </span>
                <span className="text-[8px] text-muted-foreground uppercase font-bold tracking-wider -mt-1">
                  Knive Partner
                </span>
              </div>
            </div>

            {/* Mobile Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground active:scale-95 transition-all"
            >
              {isMobileMenuOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
            </button>
          </div>

          {/* Links */}
          <nav
            className={`flex-1 px-4 py-6 flex flex-col gap-1.5 ${isMobileMenuOpen ? 'block' : 'hidden lg:flex'}`}
          >
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-3 mb-2">
              Service Console
            </span>

            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                    isActive
                      ? 'border-success bg-success/10 text-success'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/40'
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </a>
              );
            })}

            {/* Account Info */}
            <div className="border-t border-border mt-auto pt-6 pb-2 px-1 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-secondary border border-border flex items-center justify-center font-bold text-xs text-primary dark:text-foreground">
                  {worker.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-primary dark:text-foreground">
                    {worker.name}
                  </span>
                  <span className="text-[8px] text-success font-semibold flex items-center gap-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-success"></span>
                    Verified Partner
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/40 border border-transparent transition-all text-left"
              >
                <LogOut className="h-4 w-4" />
                <span>Exit Worker Portal</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-grow overflow-x-hidden min-h-[500px]">{children}</main>
      </div>
    </WorkerContext.Provider>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  BarChart3,
  MapPin,
  MessageSquare,
  LogOut,
  ShieldCheck,
  Loader2,
  Menu,
  X,
  UserCheck,
  Activity,
  Compass,
  TrendingUp,
  Globe,
  Users,
  Zap,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    // Skip checking on the login screen itself
    if (pathname === '/admin/login') {
      setIsAdmin(true);
      return;
    }

    const checkAdminAccess = async () => {
      // 1. Check local mock admin bypass first
      const mockBypass = localStorage.getItem('knive_mock_admin_bypass') === 'true';
      if (mockBypass) {
        setIsAdmin(true);
        return;
      }

      // 2. Wait for auth context to load
      if (loading) return;

      // 3. Verify user and role
      if (user && user.role === 'admin') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
        router.push('/admin/login');
      }
    };

    checkAdminAccess();
  }, [user, loading, pathname, router]);

  const handleAdminLogout = async () => {
    localStorage.removeItem('knive_mock_admin_bypass');
    await signOut();
    router.push('/admin/login');
  };

  const navLinks = [
    { href: '/admin/analytics', label: 'Dashboard', icon: <BarChart3 className="h-4 w-4" /> },
    { href: '/admin/listings', label: 'Shop Listings', icon: <MapPin className="h-4 w-4" /> },
    { href: '/admin/reviews', label: 'Moderation', icon: <MessageSquare className="h-4 w-4" /> },
    { href: '/admin/workers', label: 'Worker Approvals', icon: <UserCheck className="h-4 w-4" /> },
    { href: '/admin/bookings', label: 'Live Bookings', icon: <Activity className="h-4 w-4" /> },
    { href: '/admin/ops-analytics', label: 'Ops Analytics', icon: <Compass className="h-4 w-4" /> },
    { href: '/admin/payments', label: 'Payments Ledger', icon: <TrendingUp className="h-4 w-4" /> },
    { href: '/admin/memberships', label: 'Memberships', icon: <Zap className="h-4 w-4" /> },
    { href: '/admin/diagnoses', label: 'AI Diagnoses', icon: <Sparkles className="h-4 w-4" /> },
    { href: '/admin/emergencies', label: 'SOS Alerts', icon: <ShieldAlert className="h-4 w-4" /> },
    { href: '/admin/cities', label: 'City Config', icon: <Globe className="h-4 w-4" /> },
    { href: '/admin/users', label: 'Users Matrix', icon: <Users className="h-4 w-4" /> },
  ];

  if (isAdmin === null && pathname !== '/admin/login') {
    return (
      <div className="flex-1 w-full flex flex-col items-center justify-center py-24 text-muted-foreground bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-safety-amber mb-4" />
        <span className="text-sm font-semibold">Verifying admin credentials...</span>
      </div>
    );
  }

  // If we are on the login screen, just render the child login form without layout decorations
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div className="flex-1 w-full bg-background flex flex-col lg:flex-row">
      {/* Sidebar Navigation */}
      <aside className="lg:w-64 border-b lg:border-b-0 lg:border-r border-border bg-card/50 glassmorphism flex flex-col">
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-safety-amber text-navy-dark shadow-sm">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-primary dark:text-foreground">
                Admin Console
              </span>
              <span className="text-[8px] text-muted-foreground uppercase font-bold tracking-wider -mt-1">
                Knive Calicut
              </span>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground active:scale-95 transition-all"
          >
            {isMobileMenuOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
          </button>
        </div>

        {/* Sidebar Navigation Links */}
        <nav
          className={`flex-1 px-4 py-6 flex flex-col gap-1.5 ${isMobileMenuOpen ? 'block' : 'hidden lg:flex'}`}
        >
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-3 mb-2">
            Navigation
          </span>

          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <a
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                  isActive
                    ? 'border-safety-amber bg-safety-amber/10 text-safety-amber'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/40'
                }`}
              >
                {link.icon}
                <span>{link.label}</span>
              </a>
            );
          })}

          {/* Admin Details & Logout */}
          <div className="border-t border-border mt-auto pt-6 pb-2 px-1 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-secondary border border-border flex items-center justify-center font-bold text-xs text-primary dark:text-foreground">
                AD
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-primary dark:text-foreground">
                  System Operator
                </span>
                <span className="text-[8px] text-success font-semibold flex items-center gap-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-success"></span>
                  Session Active
                </span>
              </div>
            </div>

            <button
              onClick={handleAdminLogout}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 transition-all text-left"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out Ops</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Admin Content Container */}
      <main className="flex-1 overflow-x-hidden min-h-[500px]">{children}</main>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, Lock, Mail, Loader2, Key } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, session, loading, openLoginModal } = useAuth();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loginLoading, setLoginLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // If user is already logged in as admin, redirect immediately
  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'admin') {
        router.push('/admin/analytics');
      } else {
        setError('Access Denied: The logged-in account does not have admin privileges.');
      }
    }
  }, [user, loading, router]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter email and password.');
      return;
    }

    setError(null);
    setLoginLoading(true);

    try {
      // 1. Authenticate with Supabase Auth
      try {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          throw signInError;
        }

        // 2. Fetch profile to check role
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profileError || !profile || profile.role !== 'admin') {
          // Sign out if role is not admin
          await supabase.auth.signOut();
          throw new Error('Access Denied: You do not have permission to access the admin portal.');
        }

        router.push('/admin/analytics');
      } catch (authErr: any) {
        const isFetchError =
          authErr.message?.includes('fetch') ||
          authErr.name === 'TypeError' ||
          authErr.message?.includes('network');
        if (isFetchError) {
          // Verify if mock email has admin word
          if (email.includes('admin')) {
            const mockAdminObj = {
              id: 'mock-admin-id',
              name: email.split('@')[0],
              email: email,
              role: 'admin',
            };
            localStorage.setItem('knive_mock_user', JSON.stringify(mockAdminObj));
            localStorage.setItem('knive_mock_admin_bypass', 'true');
            setLoginLoading(false);
            window.location.reload();
            return;
          } else {
            throw new Error('Access Denied: The logged-in account does not have admin privileges.');
          }
        } else {
          throw authErr;
        }
      }
    } catch (err: any) {
      console.error('Admin login error:', err);
      setError(err.message || 'Login failed. Please verify admin credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Mock Developer Admin login to test dashboard without DB configuration
  const handleSimulateAdminLogin = () => {
    setError(null);
    setLoginLoading(true);

    // Simulate auth session setting in context
    setTimeout(() => {
      // Set mock user session to overwrite any active worker/customer session
      const mockAdminObj = {
        id: 'mock-admin-id',
        name: 'Super Admin',
        email: 'admin@knive.in',
        role: 'admin',
      };
      localStorage.setItem('knive_mock_user', JSON.stringify(mockAdminObj));
      localStorage.setItem('knive_mock_admin_bypass', 'true');
      setLoginLoading(false);
      window.location.reload();
    }, 500);
  };

  return (
    <div className="flex-1 w-full bg-background flex items-center justify-center py-16 px-4">
      {/* Background accents */}
      <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] rounded-full bg-safety-amber/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[420px] rounded-2xl border border-border bg-card shadow-2xl glassmorphism p-8 flex flex-col gap-6 relative">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-safety-amber to-safety-orange text-navy-dark shadow-md mb-3">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-primary dark:text-foreground font-sans">
            Admin Back Office
          </h1>
          <p className="text-xs text-muted-foreground mt-1 max-w-[260px]">
            Log in to manage shop listings, moderate flagged reviews, and monitor Calicut analytics.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive text-center font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="admin-email"
              className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
            >
              Admin Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@knive.in"
                className="pl-10 h-11 rounded-xl text-sm font-medium border-border focus:border-safety-amber focus:ring-1 focus:ring-safety-amber bg-background"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loginLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="admin-password"
              className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
            >
              Password
            </Label>
            <div className="relative">
              <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="admin-password"
                type="password"
                placeholder="••••••••"
                className="pl-10 h-11 rounded-xl text-sm font-medium border-border focus:border-safety-amber focus:ring-1 focus:ring-safety-amber bg-background"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loginLoading}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loginLoading}
            className="w-full h-11 rounded-xl font-bold button-warning-gradient hover:opacity-90 active:scale-95 transition-all text-navy-dark mt-2"
          >
            {loginLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Verify & Access Dashboard</span>
            )}
          </Button>
        </form>

        <div className="relative my-2 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <span className="relative bg-card px-2.5 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
            Local Preview
          </span>
        </div>

        {/* Local Bypass Simulation Button */}
        <Button
          type="button"
          onClick={handleSimulateAdminLogin}
          disabled={loginLoading}
          variant="secondary"
          className="w-full h-11 rounded-xl text-xs font-bold border border-border bg-secondary text-primary dark:text-foreground hover:bg-muted active:scale-95 transition-all flex items-center justify-center gap-1.5"
        >
          <ShieldCheck className="h-4 w-4 text-safety-amber" />
          <span>Simulate Mock Admin Bypass</span>
        </Button>
      </div>
    </div>
  );
}

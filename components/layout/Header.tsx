'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, User, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const Header: React.FC = () => {
  const { user, openLoginModal, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 glassmorphism shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          {/* Pulsing Safety Beacon Icon */}
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-safety-amber to-safety-orange text-navy-dark shadow-md animate-float">
            <ShieldAlert className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-red-500"></span>
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-primary dark:text-foreground font-sans">
              Knive
            </span>
            <span className="text-[10px] text-muted-foreground font-medium -mt-1 tracking-wider uppercase">
              Calicut MVP
            </span>
          </div>
        </div>

        {/* Navigation / Actions */}
        <div className="flex items-center gap-4">
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/#location-section"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Find Help
            </Link>
            <Link
              href="/results?lat=11.2588&lng=75.7804&issue=all"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Services
            </Link>
            <Link
              href="/membership/status"
              className="text-sm font-black text-safety-amber hover:text-safety-amber/90 transition-colors"
            >
              Knive Club
            </Link>
            <Link
              href="/admin/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Admin Portal
            </Link>
          </nav>

          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 rounded-full bg-secondary/80 px-3.5 py-1.5 text-xs font-semibold text-secondary-foreground border border-border">
                <User className="h-3.5 w-3.5 text-safety-amber" />
                <span className="max-w-[100px] truncate">{user.name || 'User'}</span>
              </div>
              <button
                onClick={signOut}
                title="Sign Out"
                className="p-1.5 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 transition-all duration-200"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={openLoginModal}
              className="flex items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-xs font-semibold text-secondary-foreground shadow-sm hover:bg-muted transition-all duration-200 border border-border"
            >
              <User className="h-3.5 w-3.5" />
              <span>Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

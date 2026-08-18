import React from 'react';
import { Phone, MapPin, Activity } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-border bg-card py-6 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-safety-amber" />
            <span>Launch City: **Calicut, Kozhikode, Kerala**</span>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Activity className="h-3.5 w-3.5 text-success animate-pulse" />
              <span>Service Status: **Online (Development Mode)**</span>
            </span>
          </div>

          <div className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Knive. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

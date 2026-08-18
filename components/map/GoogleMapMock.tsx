'use client';

import React, { useEffect, useRef } from 'react';
import { MapPin, Compass } from 'lucide-react';

interface MapMarker {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  is_open_now: boolean;
}

interface GoogleMapMockProps {
  userLat: number;
  userLng: number;
  userAddress: string;
  markers: MapMarker[];
  selectedShopId: string | null;
  onSelectShop: (id: string) => void;
  workerPing?: { latitude: number; longitude: number } | null;
}

export const GoogleMapMock: React.FC<GoogleMapMockProps> = ({
  userLat,
  userLng,
  userAddress,
  markers,
  selectedShopId,
  onSelectShop,
  workerPing,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Clear Canvas
    ctx.clearRect(0, 0, width, height);

    // 1. Draw Grid Lines (Street style grid)
    ctx.strokeStyle = '#f1f5f9';
    if (document.documentElement.classList.contains('dark')) {
      ctx.strokeStyle = '#1e293b';
      ctx.fillStyle = '#0f172a';
    } else {
      ctx.fillStyle = '#f8fafc';
    }
    ctx.fillRect(0, 0, width, height);

    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 2. Draw mock roads (Calicut main roads representation)
    ctx.strokeStyle = document.documentElement.classList.contains('dark') ? '#334155' : '#cbd5e1';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Mavoor Road (Diagonal main road)
    ctx.beginPath();
    ctx.moveTo(0, height * 0.2);
    ctx.lineTo(width * 0.6, height * 0.5);
    ctx.lineTo(width, height * 0.7);
    ctx.stroke();

    // Bypass Road (Vertical main road)
    ctx.beginPath();
    ctx.moveTo(width * 0.7, 0);
    ctx.lineTo(width * 0.7, height);
    ctx.stroke();

    // Beach Road (Left side boundary)
    ctx.beginPath();
    ctx.moveTo(width * 0.15, 0);
    ctx.lineTo(width * 0.15, height);
    ctx.stroke();

    // Secondary connector streets (thin roads)
    ctx.lineWidth = 6;
    ctx.strokeStyle = document.documentElement.classList.contains('dark') ? '#1e293b' : '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.65);
    ctx.lineTo(width * 0.7, height * 0.65);
    ctx.moveTo(width * 0.4, height * 0.1);
    ctx.lineTo(width * 0.4, height * 0.8);
    ctx.stroke();

    // 3. Coordinate mapping helper: Maps GPS coordinates (ranges close to Calicut) to Canvas coordinates
    // Calicut approx bounds: Lat 11.24 to 11.28, Lng 75.76 to 75.80
    const minLat = 11.24;
    const maxLat = 11.28;
    const minLng = 75.76;
    const maxLng = 75.8;

    const getCanvasCoords = (lat: number, lng: number) => {
      // Map Longitude to X (left to right)
      const x = ((lng - minLng) / (maxLng - minLng)) * width;
      // Map Latitude to Y (top to bottom - remember Y starts at 0 at the top, so we invert it)
      const y = (1 - (lat - minLat) / (maxLat - minLat)) * height;
      return { x, y };
    };

    // 4. Draw User Position (Blue pulse dot)
    const userCoords = getCanvasCoords(userLat, userLng);

    // Draw outer pulsing circle
    const pulseRadius = 14 + Math.sin(Date.now() / 250) * 3;
    ctx.fillStyle = 'rgba(59, 130, 246, 0.18)';
    ctx.beginPath();
    ctx.arc(userCoords.x, userCoords.y, pulseRadius, 0, Math.PI * 2);
    ctx.fill();

    // Draw inner blue circle
    ctx.fillStyle = '#2563eb';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(userCoords.x, userCoords.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Label user position
    ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#ffffff' : '#0f172a';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('You are here', userCoords.x, userCoords.y - 12);

    // 5. Draw Shop Markers
    markers.forEach((shop) => {
      const coords = getCanvasCoords(shop.latitude, shop.longitude);
      const isSelected = shop.id === selectedShopId;

      // Draw shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.beginPath();
      ctx.arc(coords.x, coords.y + 2, isSelected ? 8 : 5, 0, Math.PI * 2);
      ctx.fill();

      // Pin body color: Warning amber by default, highlighted if selected
      ctx.fillStyle = isSelected
        ? '#f97316' // Highlighted Orange
        : shop.is_open_now
          ? '#eab308' // Amber if open
          : '#94a3b8'; // Slate if closed

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = isSelected ? 2.5 : 1.5;

      // Draw custom pin path (drop shape)
      ctx.beginPath();
      const r = isSelected ? 11 : 7;
      ctx.arc(coords.x, coords.y - r, r, 0, Math.PI, true);
      ctx.lineTo(coords.x, coords.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Draw center dot
      ctx.fillStyle = isSelected ? '#ffffff' : '#0f172a';
      ctx.beginPath();
      ctx.arc(coords.x, coords.y - r, isSelected ? 4 : 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Draw glowing outline for selected marker
      if (isSelected) {
        ctx.strokeStyle = 'rgba(249, 115, 22, 0.4)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(coords.x, coords.y - r, r + 4, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Shop names next to pin (small labels)
      ctx.fillStyle = isSelected
        ? '#f97316'
        : document.documentElement.classList.contains('dark')
          ? '#94a3b8'
          : '#475569';
      ctx.font = isSelected ? 'bold 9px sans-serif' : '500 8px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(` ${shop.name.split(' ')[0]}`, coords.x + r + 2, coords.y - r + 3);
    });

    // 6. Draw Worker Responder Position (amber pulse truck dot) if present
    if (workerPing) {
      const workerCoords = getCanvasCoords(workerPing.latitude, workerPing.longitude);

      // Draw outer pulsing circle
      const wPulseRadius = 14 + Math.sin(Date.now() / 200) * 3.5;
      ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
      ctx.beginPath();
      ctx.arc(workerCoords.x, workerCoords.y, wPulseRadius, 0, Math.PI * 2);
      ctx.fill();

      // Draw inner amber circle
      ctx.fillStyle = '#f59e0b';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(workerCoords.x, workerCoords.y, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Label worker
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Knive Responder', workerCoords.x, workerCoords.y - 12);
    }
  }, [userLat, userLng, markers, selectedShopId, workerPing]);

  // Click handler to select shop from map coordinate clicks
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    // Get click coords relative to canvas
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Find nearest marker within threshold (e.g. 15px radius)
    let nearestShopId: string | null = null;
    let minDistance = 20; // click threshold

    const minLat = 11.24;
    const maxLat = 11.28;
    const minLng = 75.76;
    const maxLng = 75.8;

    markers.forEach((shop) => {
      // Map GPS to Canvas
      const x = ((shop.longitude - minLng) / (maxLng - minLng)) * rect.width;
      const y = (1 - (shop.latitude - minLat) / (maxLat - minLat)) * rect.height;
      const r = 9; // average height correction

      const distance = Math.sqrt((clickX - x) ** 2 + (clickY - (y - r)) ** 2);
      if (distance < minDistance) {
        minDistance = distance;
        nearestShopId = shop.id;
      }
    });

    if (nearestShopId) {
      onSelectShop(nearestShopId);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[300px] rounded-xl overflow-hidden border border-border shadow-inner bg-slate-50 dark:bg-slate-950">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="w-full h-full cursor-crosshair block"
      />
      {/* Map Control Widget HUD */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 glassmorphism p-2 rounded-lg border border-border text-[9px] font-bold text-muted-foreground shadow-sm">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-500"></span>
          <span>You</span>
        </div>
        {workerPing && (
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-yellow-600"></span>
            <span>Responder</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
          <span>Open Shop</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-slate-400"></span>
          <span>Closed Shop</span>
        </div>
      </div>
      <div className="absolute top-4 left-4 flex items-center gap-1 text-[10px] font-bold text-primary dark:text-foreground glassmorphism px-2.5 py-1.5 rounded-lg border border-border shadow-sm">
        <Compass className="h-3.5 w-3.5 text-safety-amber animate-spin" />
        <span>Kozhikode Interactive Map HUD</span>
      </div>
    </div>
  );
};

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  Truck,
  Trash2,
  Plus,
  Loader2,
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Calendar,
  Settings,
  ShieldAlert,
  Coins,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Vehicle {
  id: string;
  plate: string;
  make: string;
  model?: string;
  insurance_expiry: string;
}

interface MaintenanceLog {
  id: string;
  vehicle_id: string;
  description: string;
  cost: number;
  maintenance_date: string;
  vehicle_plate?: string;
}

export default function FleetDashboardPage() {
  const router = useRouter();
  const { user, openLoginModal } = useAuth();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);

  // Forms
  const [plate, setPlate] = useState<string>('');
  const [make, setMake] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [expiry, setExpiry] = useState<string>('');

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [logDesc, setLogDesc] = useState<string>('');
  const [logCost, setLogCost] = useState<string>('');
  const [logDate, setLogDate] = useState<string>('');

  const [error, setError] = useState<string | null>(null);

  const fetchFleetData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let dbSuccess = false;

      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
      ) {
        const { data: vData } = await supabase
          .from('fleet_vehicles')
          .select('*')
          .eq('fleet_admin_id', user.id);

        if (vData) {
          dbSuccess = true;
          setVehicles(vData as Vehicle[]);

          if (vData.length > 0) {
            const vIds = vData.map((v) => v.id);
            const { data: lData } = await supabase
              .from('fleet_maintenance_logs')
              .select('*')
              .in('vehicle_id', vIds)
              .order('maintenance_date', { ascending: false });

            if (lData) {
              setLogs(
                lData.map((l: any) => {
                  const vPlate = vData.find((v) => v.id === l.vehicle_id)?.plate || 'Vehicle';
                  return { ...l, vehicle_plate: vPlate };
                })
              );
            }
          }
        }
      }

      if (!dbSuccess) {
        setVehicles([
          {
            id: 'v-1',
            plate: 'KL-11-AA-5555',
            make: 'Tata Ace',
            model: 'Gold',
            insurance_expiry: new Date(Date.now() + 3600000 * 24 * 15).toISOString().split('T')[0],
          },
          {
            id: 'v-2',
            plate: 'KL-11-BB-6666',
            make: 'Mahindra PickUp',
            model: 'Bolero',
            insurance_expiry: new Date(Date.now() + 3600000 * 24 * 90).toISOString().split('T')[0],
          },
        ]);
        setLogs([
          {
            id: 'log-1',
            vehicle_id: 'v-1',
            description: 'Engine oil filter change',
            cost: 1500,
            maintenance_date: new Date(Date.now() - 3600000 * 24 * 5).toISOString().split('T')[0],
            vehicle_plate: 'KL-11-AA-5555',
          },
        ]);
      }
    } catch (err) {
      console.error('Error fetching fleet metrics:', err);
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
    fetchFleetData();
  }, [user]);

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !plate || !make || !expiry) return;

    setSaveLoading(true);
    setError(null);

    try {
      let newId = `v-${Date.now()}`;

      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
      ) {
        const { data, error } = await supabase
          .from('fleet_vehicles')
          .insert({
            fleet_admin_id: user.id,
            plate: plate.trim(),
            make: make.trim(),
            model: model.trim() || null,
            insurance_expiry: expiry,
          })
          .select('id')
          .single();

        if (error) {
          setError(error.message);
          setSaveLoading(false);
          return;
        } else if (data) {
          newId = data.id;
        }
      }

      setVehicles((prev) => [
        ...prev,
        {
          id: newId,
          plate: plate.trim(),
          make: make.trim(),
          model: model.trim() || undefined,
          insurance_expiry: expiry,
        },
      ]);
      setPlate('');
      setMake('');
      setModel('');
      setExpiry('');
    } catch (err) {
      console.error('Error adding vehicle:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleAddMaintenanceLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedVehicleId || !logDesc || !logCost || !logDate) return;

    setSaveLoading(true);
    try {
      let newId = `log-${Date.now()}`;

      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
      ) {
        const { data, error } = await supabase
          .from('fleet_maintenance_logs')
          .insert({
            vehicle_id: selectedVehicleId,
            description: logDesc.trim(),
            cost: parseFloat(logCost) || 0,
            maintenance_date: logDate,
          })
          .select('id')
          .single();

        if (error) {
          setError(error.message);
          setSaveLoading(false);
          return;
        } else if (data) {
          newId = data.id;
        }
      }

      const vPlate = vehicles.find((v) => v.id === selectedVehicleId)?.plate || 'Vehicle';
      setLogs((prev) => [
        {
          id: newId,
          vehicle_id: selectedVehicleId,
          description: logDesc.trim(),
          cost: parseFloat(logCost) || 0,
          maintenance_date: logDate,
          vehicle_plate: vPlate,
        },
        ...prev,
      ]);

      setLogDesc('');
      setLogCost('');
      setLogDate('');
    } catch (err) {
      console.error('Error logging maintenance:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  const checkInsuranceDue = (expiryDate: string) => {
    const diffTime = new Date(expiryDate).getTime() - Date.now();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 30; // Due within 30 days
  };

  if (!user) {
    return (
      <div className="flex-grow w-full flex flex-col items-center justify-center py-20 text-center px-4">
        <ShieldCheck className="h-10 w-10 text-muted-foreground mb-3 animate-pulse" />
        <span className="text-sm font-bold text-primary dark:text-foreground mb-1">
          Access Restrained
        </span>
        <p className="text-xs text-muted-foreground max-w-xs mb-4">
          Please log in to manage your commercial vehicle fleet.
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
        <span className="text-sm font-semibold">Consolidating fleet metrics...</span>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 w-full max-w-6xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-border/60 pb-4">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-widest text-safety-amber">
            Enterprise Back Office
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-primary dark:text-foreground font-sans">
            Fleet Operations Console
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Reconcile company logistics cars, log workshop maintenance costs, and audit insurance
            renewal timers.
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Col: Vehicle Lists */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Vehicles list */}
          <div className="p-6 rounded-2xl border border-border bg-card/60 glassmorphism flex flex-col gap-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2 flex items-center gap-1.5">
              <Truck className="h-4 w-4 text-success" />
              <span>Fleet Vehicles Ledger</span>
            </h3>

            {vehicles.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground border border-dashed border-border rounded-xl">
                No vehicles listed.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {vehicles.map((v) => {
                  const isDue = checkInsuranceDue(v.insurance_expiry);
                  return (
                    <div
                      key={v.id}
                      className={`p-4 rounded-xl border flex flex-col gap-2 transition-all ${
                        isDue
                          ? 'border-red-500/30 bg-red-500/[0.02]'
                          : 'border-border bg-background/50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-black text-primary dark:text-foreground">
                          {v.plate}
                        </span>
                        {isDue && (
                          <span className="text-[8px] font-black uppercase tracking-wider text-red-500 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/15 flex items-center gap-0.5">
                            <ShieldAlert className="h-2.5 w-2.5" />
                            <span>Insurance due</span>
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-semibold">
                        {v.make} {v.model && `(${v.model})`}
                      </div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1 font-bold">
                        <Calendar className="h-3.5 w-3.5 text-safety-amber" />
                        <span>Expiry: {v.insurance_expiry}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Maintenance list */}
          <div className="p-6 rounded-2xl border border-border bg-card/60 glassmorphism flex flex-col gap-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2 flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-success" />
              <span>Workshop Maintenance logs</span>
            </h3>

            {logs.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground border border-dashed border-border rounded-xl">
                No maintenance history logged.
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground font-bold text-[9px] uppercase tracking-wider">
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Vehicle</th>
                      <th className="pb-2">Work Description</th>
                      <th className="pb-2 text-right">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-secondary/20">
                        <td className="py-2.5 text-muted-foreground">{log.maintenance_date}</td>
                        <td className="py-2.5 font-bold text-primary dark:text-foreground">
                          {log.vehicle_plate}
                        </td>
                        <td className="py-2.5 text-muted-foreground">{log.description}</td>
                        <td className="py-2.5 text-right font-semibold text-primary dark:text-foreground">
                          ₹{log.cost}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Forms */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Form Add vehicle */}
          <div className="p-6 rounded-2xl border border-border bg-card/60 glassmorphism flex flex-col gap-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2 flex items-center gap-1.5">
              <Plus className="h-4 w-4 text-success" />
              <span>Add Vehicle</span>
            </h3>

            <form onSubmit={handleAddVehicle} className="space-y-3">
              <div className="space-y-1">
                <Label
                  htmlFor="v-plate"
                  className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider"
                >
                  Plate number *
                </Label>
                <Input
                  id="v-plate"
                  placeholder="KL-11-AA-5555"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value)}
                  className="h-9 text-xs rounded-xl border-border bg-background"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label
                  htmlFor="v-make"
                  className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider"
                >
                  Make *
                </Label>
                <Input
                  id="v-make"
                  placeholder="Tata"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  className="h-9 text-xs rounded-xl border-border bg-background"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label
                  htmlFor="v-model"
                  className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider"
                >
                  Model
                </Label>
                <Input
                  id="v-model"
                  placeholder="Ace Gold"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="h-9 text-xs rounded-xl border-border bg-background"
                />
              </div>
              <div className="space-y-1">
                <Label
                  htmlFor="v-expiry"
                  className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider"
                >
                  Insurance Expiry *
                </Label>
                <Input
                  id="v-expiry"
                  type="date"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  className="h-9 text-xs rounded-xl border-border bg-background"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={saveLoading}
                className="w-full h-9 rounded-xl font-bold bg-success hover:bg-success/90 text-white active:scale-95 transition-all text-xs"
              >
                {saveLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Vehicle'}
              </Button>
            </form>
          </div>

          {/* Form log maintenance */}
          {vehicles.length > 0 && (
            <div className="p-6 rounded-2xl border border-border bg-card/60 glassmorphism flex flex-col gap-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2 flex items-center gap-1.5">
                <Coins className="h-4 w-4 text-safety-amber" />
                <span>Log Maintenance</span>
              </h3>

              <form onSubmit={handleAddMaintenanceLog} className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Select Vehicle *
                  </Label>
                  <select
                    className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs font-semibold focus:outline-none"
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose vehicle --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.plate} ({v.make})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label
                    htmlFor="log-desc"
                    className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider"
                  >
                    Work Details *
                  </Label>
                  <Input
                    id="log-desc"
                    placeholder="Tyre repair / oil filter"
                    value={logDesc}
                    onChange={(e) => setLogDesc(e.target.value)}
                    className="h-9 text-xs rounded-xl border-border bg-background"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label
                    htmlFor="log-cost"
                    className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider"
                  >
                    Cost (INR) *
                  </Label>
                  <Input
                    id="log-cost"
                    type="number"
                    placeholder="2500"
                    value={logCost}
                    onChange={(e) => setLogCost(e.target.value)}
                    className="h-9 text-xs rounded-xl border-border bg-background"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label
                    htmlFor="log-date"
                    className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider"
                  >
                    Service Date *
                  </Label>
                  <Input
                    id="log-date"
                    type="date"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="h-9 text-xs rounded-xl border-border bg-background"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={saveLoading}
                  className="w-full h-9 rounded-xl font-bold bg-success hover:bg-success/90 text-white active:scale-95 transition-all text-xs"
                >
                  {saveLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Log Workshop Cost'}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

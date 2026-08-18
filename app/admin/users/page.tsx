'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, UserCheck, ShieldCheck, Users, Mail, Phone, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProfileRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'worker' | 'admin';
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<ProfileRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let dbSuccess = false;

      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
      ) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('name', { ascending: true });

        if (!error && data) {
          setUsers(data as ProfileRecord[]);
          dbSuccess = true;
        }
      }

      if (!dbSuccess) {
        setUsers([
          {
            id: 'user-a1',
            name: 'Dilip Kumar Calicut',
            email: 'dilip@calicut.com',
            phone: '9876543220',
            role: 'worker',
          },
          {
            id: 'user-a2',
            name: 'Ravi Verma Kochi',
            email: 'ravi@kochi.com',
            phone: '9876543221',
            role: 'customer',
          },
          {
            id: 'user-a3',
            name: 'Sreedhar Calicut',
            email: 'sreedhar@calicut.com',
            phone: '9876543222',
            role: 'admin',
          },
        ]);
      }
    } catch (err) {
      console.error('Error fetching profiles list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChangeRole = async (userId: string, newRole: 'customer' | 'worker' | 'admin') => {
    setActionLoading(userId);
    try {
      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('.supabase.co')
      ) {
        await supabase.from('users').update({ role: newRole }).eq('id', userId);
      }
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    } catch (err) {
      console.error('Role update failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 w-full max-w-5xl mx-auto">
      {/* Title */}
      <div className="flex flex-col border-b border-border/60 pb-4">
        <span className="text-[10px] font-black uppercase tracking-widest text-safety-amber">
          Super Admin permissions Desk
        </span>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-primary dark:text-foreground font-sans">
          Operator User Directory
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Audit database user profiles and configure role assignments (Admin, worker, customer)
          dynamically.
        </p>
      </div>

      {/* USER LISTING */}
      <div className="p-6 rounded-2xl border border-border bg-card/60 glassmorphism flex flex-col gap-4 shadow-sm">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2 flex items-center gap-1.5">
          <Users className="h-4 w-4 text-success" />
          <span>Security Group Matrix</span>
        </h3>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-background">
            <Loader2 className="h-10 w-10 animate-spin text-safety-amber mb-4" />
            <span className="text-sm font-semibold">Resolving user accounts...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground border border-dashed border-border rounded-xl">
            No profiles registered.
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground font-bold text-[9px] uppercase tracking-wider">
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Contact</th>
                  <th className="pb-3">Current Role</th>
                  <th className="pb-3 text-center">Change Permission Group</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-semibold">
                {users.map((rec) => (
                  <tr key={rec.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="py-3 font-bold text-primary dark:text-foreground">{rec.name}</td>
                    <td className="py-3 text-muted-foreground">
                      <div className="flex flex-col gap-0.5">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {rec.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {rec.phone}
                        </span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center gap-0.5 text-[8.5px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                          rec.role === 'admin'
                            ? 'bg-red-500/10 text-red-500 border-red-500/20'
                            : rec.role === 'worker'
                              ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                              : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                        }`}
                      >
                        {rec.role}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <div className="inline-flex gap-2">
                        {rec.role !== 'admin' && (
                          <Button
                            onClick={() => handleChangeRole(rec.id, 'admin')}
                            disabled={actionLoading === rec.id}
                            className="h-7 rounded-lg text-[8.5px] font-black uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white px-2.5"
                          >
                            Set Admin
                          </Button>
                        )}
                        {rec.role !== 'worker' && (
                          <Button
                            onClick={() => handleChangeRole(rec.id, 'worker')}
                            disabled={actionLoading === rec.id}
                            className="h-7 rounded-lg text-[8.5px] font-black uppercase tracking-wider bg-secondary hover:bg-muted text-primary dark:text-foreground border border-border px-2.5"
                          >
                            Set Worker
                          </Button>
                        )}
                        {rec.role !== 'customer' && (
                          <Button
                            onClick={() => handleChangeRole(rec.id, 'customer')}
                            disabled={actionLoading === rec.id}
                            className="h-7 rounded-lg text-[8.5px] font-black uppercase tracking-wider bg-secondary hover:bg-muted text-primary dark:text-foreground border border-border px-2.5"
                          >
                            Set Customer
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

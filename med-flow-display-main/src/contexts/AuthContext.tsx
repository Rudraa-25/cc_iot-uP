import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getProfile } from '@/supabase/auth';
import * as authService from '@/supabase/auth';
import type { Profile } from '@/types/database';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  role: 'patient' | 'doctor' | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    role: 'patient' | 'doctor',
    fullName: string,
    extras?: Partial<Profile>
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchAndSetProfile = async (userId: string) => {
    const p = await getProfile(userId);
    setProfile(p);
    return p;
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchAndSetProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        await fetchAndSetProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { user: u } = await authService.signIn(email, password);
    if (u) {
      setUser(u);
      const p = await fetchAndSetProfile(u.id);
      navigate(p?.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard');
    }
  };

  const register = async (
    email: string,
    password: string,
    role: 'patient' | 'doctor',
    fullName: string,
    extras?: Partial<Profile>
  ) => {
    const { user: u } = await authService.signUp(email, password, role, fullName, extras);
    if (u) {
      setUser(u);
      const p = await fetchAndSetProfile(u.id);
      navigate(p?.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard');
    }
  };

  const logout = async () => {
    await authService.signOut();
    setUser(null);
    setProfile(null);
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, profile, role: profile?.role ?? null, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

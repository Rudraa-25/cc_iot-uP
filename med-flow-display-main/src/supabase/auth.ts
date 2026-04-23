import { supabase } from '@/integrations/supabase/client';
import type { Profile } from '@/types/database';

export async function signUp(
  email: string,
  password: string,
  role: 'patient' | 'doctor',
  fullName: string,
  extras?: Partial<Profile>
) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error('Signup failed');

  const { error: profileError } = await supabase.from('profiles').insert({
    id: data.user.id,
    role,
    full_name: fullName,
    email,
    blood_type: extras?.blood_type ?? null,
    emergency_contact: extras?.emergency_contact ?? null,
    assigned_device: extras?.assigned_device ?? null,
    specialization: extras?.specialization ?? null,
    license_no: extras?.license_no ?? null,
    hospital: extras?.hospital ?? null,
  });
  if (profileError) throw profileError;

  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data as unknown as Profile;
}

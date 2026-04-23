import { supabase } from '@/integrations/supabase/client';
import type { Vital, FallAlert } from '@/types/database';
import type { RealtimeChannel } from '@supabase/supabase-js';

export async function fetchVitals(deviceId: string, limit = 60): Promise<Vital[]> {
  const { data, error } = await supabase
    .from('vitals')
    .select('*')
    .eq('device_id', deviceId)
    .order('recorded_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as unknown as Vital[]).reverse();
}

export function subscribeVitals(
  deviceId: string,
  onNew: (vital: Vital) => void
): RealtimeChannel {
  return supabase
    .channel(`vitals-${deviceId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'vitals', filter: `device_id=eq.${deviceId}` },
      (payload) => onNew(payload.new as unknown as Vital)
    )
    .subscribe();
}

export function subscribeAllVitals(onNew: (vital: Vital) => void): RealtimeChannel {
  return supabase
    .channel('all-vitals')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'vitals' },
      (payload) => onNew(payload.new as unknown as Vital)
    )
    .subscribe();
}

export function subscribeFallAlerts(
  deviceId: string,
  onAlert: (alert: FallAlert) => void
): RealtimeChannel {
  return supabase
    .channel(`alerts-${deviceId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'fall_alerts', filter: `device_id=eq.${deviceId}` },
      (payload) => onAlert(payload.new as unknown as FallAlert)
    )
    .subscribe();
}

export async function resolveFallAlert(alertId: number, userId: string) {
  const { error } = await supabase
    .from('fall_alerts')
    .update({ resolved: true, resolved_by: userId, resolved_at: new Date().toISOString() })
    .eq('id', alertId);
  if (error) throw error;
}

export async function fetchActiveAlerts(): Promise<FallAlert[]> {
  const { data, error } = await supabase
    .from('active_alerts')
    .select('*');
  if (error) throw error;
  return data as unknown as FallAlert[];
}

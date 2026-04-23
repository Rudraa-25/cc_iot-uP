import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchVitals, subscribeVitals, subscribeFallAlerts } from '@/supabase/vitals';
import type { Vital, FallAlert, Device } from '@/types/database';

const DEVICE_ID = 'esp32-chainpulse-001';

export function useDashboardVitals() {
  const [history, setHistory] = useState<Vital[]>([]);
  const [latest, setLatest] = useState<Vital | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState<FallAlert[]>([]);
  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const staleTimer = useRef<ReturnType<typeof setInterval>>();

  // Fetch initial history + device
  useEffect(() => {
    Promise.all([
      fetchVitals(DEVICE_ID, 100).catch(() => [] as Vital[]),
      supabase.from('devices').select('*').eq('device_id', DEVICE_ID).single(),
      supabase.from('fall_alerts').select('*').eq('resolved', false).eq('device_id', DEVICE_ID).order('created_at', { ascending: false }),
    ]).then(([vitals, deviceRes, alertsRes]) => {
      setHistory(vitals);
      if (vitals.length > 0) {
        setLatest(vitals[vitals.length - 1]);
        setLastUpdate(new Date(vitals[vitals.length - 1].recorded_at ?? Date.now()));
      }
      if (deviceRes.data) setDevice(deviceRes.data as unknown as Device);
      if (alertsRes.data) setActiveAlerts(alertsRes.data as unknown as FallAlert[]);
      setLoading(false);
    });
  }, []);

  // Subscribe to realtime vitals
  useEffect(() => {
    const channel = subscribeVitals(DEVICE_ID, (vital) => {
      setLatest(vital);
      setHistory(prev => [...prev, vital].slice(-100));
      setLastUpdate(new Date());
    });
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Subscribe to fall alerts
  useEffect(() => {
    const channel = subscribeFallAlerts(DEVICE_ID, (alert) => {
      setActiveAlerts(prev => [alert, ...prev]);
    });
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Subscribe to device updates
  useEffect(() => {
    const channel = supabase
      .channel('device-status-dash')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'devices', filter: `device_id=eq.${DEVICE_ID}` },
        (payload) => setDevice(payload.new as unknown as Device))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Stale detection
  useEffect(() => {
    staleTimer.current = setInterval(() => {
      setIsStale(lastUpdate ? Date.now() - lastUpdate.getTime() > 15000 : false);
    }, 1000);
    return () => clearInterval(staleTimer.current);
  }, [lastUpdate]);

  const resolveAlert = useCallback((alertId: number) => {
    setActiveAlerts(prev => prev.filter(a => a.id !== alertId));
  }, []);

  return { history, latest, lastUpdate, isStale, activeAlerts, resolveAlert, device, loading, deviceId: DEVICE_ID };
}

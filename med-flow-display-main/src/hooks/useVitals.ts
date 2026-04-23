import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchVitals, subscribeVitals, subscribeFallAlerts } from '@/supabase/vitals';
import { useBLE } from '@/hooks/useBLE';
import type { Vital, FallAlert } from '@/types/database';

export function useVitals(deviceId: string) {
  const ble = useBLE();
  const [history, setHistory] = useState<Vital[]>([]);
  const [latest, setLatest] = useState<Vital | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState<FallAlert[]>([]);
  const staleTimer = useRef<ReturnType<typeof setInterval>>();

  // Merge BLE data into Supabase
  useEffect(() => {
    if (!ble.vitals) return;
    const v = ble.vitals;
    const now = new Date();
    setLastUpdate(now);

    const vitalRow: Vital = {
      id: Date.now(),
      device_id: deviceId,
      heart_rate: v.hr,
      hr_valid: v.hrOk,
      spo2: v.spo2,
      spo2_valid: v.spo2Ok,
      temp_body: v.tempBody,
      temp_ambient: v.tempAmb,
      humidity: v.humidity,
      g_force: v.gforce,
      roll: v.roll,
      pitch: v.pitch,
      gyro_x: v.gyroX,
      gyro_y: v.gyroY,
      gyro_z: v.gyroZ,
      fall_detected: v.fall,
      recorded_at: now.toISOString(),
    };

    setLatest(vitalRow);
    setHistory(prev => [...prev, vitalRow].slice(-100));

    // Push to Supabase in background
    supabase.from('vitals').insert({
      device_id: deviceId,
      heart_rate: v.hr,
      hr_valid: v.hrOk,
      spo2: v.spo2,
      spo2_valid: v.spo2Ok,
      temp_body: v.tempBody,
      temp_ambient: v.tempAmb,
      humidity: v.humidity,
      g_force: v.gforce,
      roll: v.roll,
      pitch: v.pitch,
      gyro_x: v.gyroX,
      gyro_y: v.gyroY,
      gyro_z: v.gyroZ,
      fall_detected: v.fall,
    }).then(() => {
      // Update device last_seen
      supabase.from('devices').update({ is_online: true, last_seen: now.toISOString() })
        .eq('device_id', deviceId).then(() => {});
    });

    // Insert fall alert if detected
    if (v.fall) {
      supabase.from('fall_alerts').insert({
        device_id: deviceId,
        g_force: v.gforce,
        roll: v.roll,
        pitch: v.pitch,
      }).then(() => {});
    }
  }, [ble.vitals, deviceId]);

  // Fetch initial history
  useEffect(() => {
    fetchVitals(deviceId, 60).then(data => {
      setHistory(data);
      if (data.length > 0) {
        setLatest(data[data.length - 1]);
        setLastUpdate(new Date(data[data.length - 1].recorded_at ?? Date.now()));
      }
    }).catch(() => {});
  }, [deviceId]);

  // Subscribe to realtime vitals from Supabase (for when data comes from other sources)
  useEffect(() => {
    const channel = subscribeVitals(deviceId, (vital) => {
      setLatest(vital);
      setHistory(prev => [...prev, vital].slice(-100));
      setLastUpdate(new Date());
    });
    return () => { supabase.removeChannel(channel); };
  }, [deviceId]);

  // Subscribe to fall alerts
  useEffect(() => {
    const channel = subscribeFallAlerts(deviceId, (alert) => {
      setActiveAlerts(prev => [alert, ...prev]);
    });
    return () => { supabase.removeChannel(channel); };
  }, [deviceId]);

  // Stale detection
  useEffect(() => {
    staleTimer.current = setInterval(() => {
      if (lastUpdate && Date.now() - lastUpdate.getTime() > 15000) {
        setIsStale(true);
      } else {
        setIsStale(false);
      }
    }, 1000);
    return () => clearInterval(staleTimer.current);
  }, [lastUpdate]);

  const resolveAlert = useCallback((alertId: number) => {
    setActiveAlerts(prev => prev.filter(a => a.id !== alertId));
  }, []);

  return {
    ble,
    history,
    latest,
    lastUpdate,
    isStale,
    activeAlerts,
    resolveAlert,
  };
}

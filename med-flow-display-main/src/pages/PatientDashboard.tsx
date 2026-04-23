import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Bluetooth, Loader2, AlertTriangle, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useVitals } from '@/hooks/useVitals';
import { HeartRateCard } from '@/components/vital-cards/HeartRateCard';
import { SPO2Card } from '@/components/vital-cards/SPO2Card';
import { TempCard } from '@/components/vital-cards/TempCard';
import { EnvCard } from '@/components/vital-cards/EnvCard';
import { MotionCard } from '@/components/vital-cards/MotionCard';
import { DeviceStatusCard } from '@/components/vital-cards/DeviceStatusCard';
import { VitalAreaChart } from '@/components/charts/VitalAreaChart';
import { FallModal } from '@/components/FallModal';
import { resolveFallAlert } from '@/supabase/vitals';
import { supabase } from '@/integrations/supabase/client';
import type { Device } from '@/types/database';

const DEVICE_ID = 'esp32-chainpulse-001';

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardAnim = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4 } },
};

export default function PatientDashboard() {
  const { profile, user, logout } = useAuth();
  const { ble, history, latest, lastUpdate, isStale, activeAlerts, resolveAlert } = useVitals(DEVICE_ID);
  const [clock, setClock] = useState(new Date());
  const [device, setDevice] = useState<Device | null>(null);
  const [currentAlert, setCurrentAlert] = useState<typeof activeAlerts[0] | null>(null);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Fetch device
  useEffect(() => {
    supabase.from('devices').select('*').eq('device_id', DEVICE_ID).single()
      .then(({ data }) => { if (data) setDevice(data as unknown as Device); });

    const channel = supabase
      .channel('device-status')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'devices', filter: `device_id=eq.${DEVICE_ID}` },
        (payload) => setDevice(payload.new as unknown as Device))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Show fall modal
  useEffect(() => {
    if (activeAlerts.length > 0 && !currentAlert) {
      setCurrentAlert(activeAlerts[0]);
    }
  }, [activeAlerts, currentAlert]);

  const sparkHR = useMemo(() => history.slice(-20).map(v => v.heart_rate ?? 0), [history]);
  const sparkSPO2 = useMemo(() => history.slice(-20).map(v => v.spo2 ?? 0), [history]);
  const sparkTemp = useMemo(() => history.slice(-20).map(v => v.temp_body ?? 0), [history]);

  const handleResolveAlert = async () => {
    if (currentAlert && user) {
      try {
        await resolveFallAlert(currentAlert.id, user.id);
        resolveAlert(currentAlert.id);
      } catch {
        // silently fail
      }
      setCurrentAlert(null);
    }
  };

  return (
    <div className="min-h-screen bg-grid">
      {/* Navbar */}
      <nav className="sticky top-0 z-20 border-b" style={{ borderColor: 'hsl(var(--border))', backgroundColor: 'hsl(var(--surface) / 0.9)', backdropFilter: 'blur(12px)' }}>
        <div className="container flex items-center justify-between py-3">
          <h1 className="font-display text-xl font-bold" style={{ color: 'var(--cyan-raw)' }}>ChainPulse</h1>
          <span className="font-mono text-sm text-t2 hidden sm:block">
            {clock.toLocaleTimeString('en-US', { hour12: false })}
          </span>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono"
              style={{
                backgroundColor: ble.state === 'connected' ? 'var(--green-glow)' : 'hsl(var(--elevated))',
                color: ble.state === 'connected' ? 'var(--green-raw)' : 'hsl(var(--t3))',
              }}
            >
              <Bluetooth className="w-3 h-3" />
              {ble.state === 'connected' ? 'BLE' : 'OFF'}
            </div>
            <Bell className="w-4 h-4 text-t3" />
            <button
              onClick={logout}
              className="w-8 h-8 rounded-full bg-elevated flex items-center justify-center text-xs font-display font-bold text-t1"
            >
              {profile?.full_name?.charAt(0) ?? 'U'}
            </button>
          </div>
        </div>
      </nav>

      <main className="container py-6 space-y-6">
        {/* BLE Connect Panel */}
        {ble.state !== 'connected' && (
          <motion.div
            className="cp-card p-8 text-center"
            initial={{ height: 'auto' }}
            exit={{ height: 0, opacity: 0 }}
          >
            {/* Radar animation */}
            <div className="relative w-32 h-32 mx-auto mb-6">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className={`absolute inset-0 rounded-full border radar-ping ${i === 1 ? 'radar-ping-delay-1' : i === 2 ? 'radar-ping-delay-2' : ''}`}
                  style={{ borderColor: 'var(--purple-raw)' }}
                />
              ))}
              <div className="absolute inset-0 flex items-center justify-center">
                <Bluetooth className="w-8 h-8" style={{ color: 'var(--purple-raw)' }} />
              </div>
            </div>

            <h2 className="font-display text-2xl font-bold text-t1 mb-2">Scan for ChainPulse Device</h2>
            <p className="text-sm text-t2 font-body mb-6">
              {ble.state === 'unsupported'
                ? 'Web Bluetooth requires Chrome or Edge on desktop.'
                : 'Make sure your ESP32 device is powered on and nearby.'}
            </p>

            {ble.state !== 'unsupported' && (
              <button
                onClick={ble.connect}
                disabled={ble.state === 'connecting'}
                className="px-8 py-3 rounded-xl font-display font-bold text-lg transition-all disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #7C4DFF, #00E5FF)',
                  color: '#fff',
                }}
              >
                {ble.state === 'connecting' ? (
                  <span className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Scanning...</span>
                ) : 'Connect Device'}
              </button>
            )}

            {ble.error && (
              <p className="text-sm mt-4" style={{ color: 'var(--red-raw)' }}>{ble.error}</p>
            )}
          </motion.div>
        )}

        {/* Stale data banner */}
        {isStale && (
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-body"
            style={{ backgroundColor: 'rgba(255,179,0,0.1)', color: 'var(--amber-raw)', border: '1px solid rgba(255,179,0,0.3)' }}
          >
            <AlertTriangle className="w-4 h-4" />
            STALE DATA — Device may be out of range
          </div>
        )}

        {/* Vital Cards Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <motion.div variants={cardAnim}>
            <HeartRateCard value={latest?.heart_rate ?? null} sparklineData={sparkHR} />
          </motion.div>
          <motion.div variants={cardAnim}>
            <SPO2Card value={latest?.spo2 ?? null} sparklineData={sparkSPO2} />
          </motion.div>
          <motion.div variants={cardAnim}>
            <TempCard value={latest?.temp_body ?? null} sparklineData={sparkTemp} />
          </motion.div>
          <motion.div variants={cardAnim}>
            <EnvCard tempAmbient={latest?.temp_ambient ?? null} humidity={latest?.humidity ?? null} />
          </motion.div>
          <motion.div variants={cardAnim}>
            <MotionCard
              gForce={latest?.g_force ?? null}
              roll={latest?.roll ?? null}
              pitch={latest?.pitch ?? null}
              gyroX={latest?.gyro_x ?? null}
              gyroY={latest?.gyro_y ?? null}
              gyroZ={latest?.gyro_z ?? null}
              fallDetected={latest?.fall_detected ?? false}
            />
          </motion.div>
          <motion.div variants={cardAnim}>
            <DeviceStatusCard bleState={ble.state} lastUpdate={lastUpdate} device={device} />
          </motion.div>
        </motion.div>

        {/* Charts */}
        <div className="space-y-4">
          <VitalAreaChart
            title="Heart Rate"
            data={history}
            dataKey="heart_rate"
            color="#FF1744"
            unit=" BPM"
            domain={[40, 160]}
          />
          <VitalAreaChart
            title="SpO2"
            data={history}
            dataKey="spo2"
            color="#00E5FF"
            unit="%"
            domain={[85, 100]}
          />
          <VitalAreaChart
            title="Temperature"
            data={history}
            dataKey="temp_body"
            color="#FF6D00"
            unit="°C"
            domain={[34, 42]}
            secondaryKey="temp_ambient"
            secondaryColor="#00BCD4"
          />
        </div>
      </main>

      {/* Fall Alert Modal */}
      <FallModal
        alert={currentAlert}
        emergencyContact={profile?.emergency_contact}
        onResolve={handleResolveAlert}
      />
    </div>
  );
}

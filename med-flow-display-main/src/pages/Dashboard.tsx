import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Clock, Wifi, WifiOff, AlertTriangle, Download, Heart,
  Thermometer, Droplets, Wind, Cpu, Bluetooth, Cloud, CheckCircle,
  ShieldCheck, Phone,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ComposedChart, Line, LineChart,
} from 'recharts';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

/* ─── Types ─── */
interface Vital {
  id: number;
  device_id: string;
  heart_rate: number | null;
  hr_valid: boolean | null;
  spo2: number | null;
  spo2_valid: boolean | null;
  temp_body: number | null;
  temp_ambient: number | null;
  humidity: number | null;
  g_force: number | null;
  roll: number | null;
  pitch: number | null;
  gyro_x: number | null;
  gyro_y: number | null;
  gyro_z: number | null;
  fall_detected: boolean | null;
  recorded_at: string | null;
}

interface FallAlert {
  id: number;
  device_id: string;
  g_force: number | null;
  roll: number | null;
  pitch: number | null;
  resolved: boolean | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string | null;
}

interface Device {
  id: string;
  device_id: string;
  patient_name: string | null;
  is_online: boolean | null;
  last_seen: string | null;
  firmware_ver: string | null;
}

type Status = 'normal' | 'warning' | 'critical' | 'unknown';

/* ─── Status helpers ─── */
function getHRStatus(v: number | null): Status {
  if (!v || v <= 0) return 'unknown';
  if (v < 50 || v > 120) return 'critical';
  if (v < 60 || v > 100) return 'warning';
  return 'normal';
}
function getSPO2Status(v: number | null): Status {
  if (!v || v <= 0) return 'unknown';
  if (v < 90) return 'critical';
  if (v < 95) return 'warning';
  return 'normal';
}
function getTempStatus(v: number | null): Status {
  if (!v || v <= 0) return 'unknown';
  if (v < 35 || v > 39.5) return 'critical';
  if (v > 37.5) return 'warning';
  return 'normal';
}
function getGForceStatus(v: number | null, fall: boolean): Status {
  if (fall) return 'critical';
  if (!v) return 'unknown';
  if (v > 2.0) return 'warning';
  return 'normal';
}

const STATUS_COLORS: Record<Status, string> = {
  normal: '#00E676', warning: '#FFB300', critical: '#FF1744', unknown: '#3D4756',
};

const HR_LABELS: Record<Status, string> = { normal: 'NORMAL', warning: 'ELEVATED', critical: 'CRITICAL', unknown: 'NO SIGNAL' };
const SPO2_LABELS: Record<Status, string> = { normal: 'NORMAL', warning: 'LOW', critical: 'DANGER', unknown: 'NO SIGNAL' };
const TEMP_LABELS: Record<Status, string> = { normal: 'NORMAL', warning: 'LOW FEVER', critical: 'FEVER', unknown: 'NO DATA' };
const GFORCE_LABELS: Record<Status, string> = { normal: 'STABLE', warning: 'MOVEMENT', critical: 'FALL!', unknown: '--' };

function cardClass(status: Status) {
  return `cp-card cp-card-${status === 'unknown' ? '' : status}`.trim();
}

function StatusBadge({ status, label }: { status: Status; label: string }) {
  const c = STATUS_COLORS[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider"
      style={{ backgroundColor: `${c}22`, color: c, border: `1px solid ${c}33` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c }} />
      {label}
    </span>
  );
}

/* ─── Mini Sparkline ─── */
function Sparkline({ data, color, height = 40 }: { data: number[]; color: string; height?: number }) {
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <defs>
          <filter id={`spark-glow-${color.replace('#', '')}`}>
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <Line
          type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false}
          style={{ filter: `url(#spark-glow-${color.replace('#', '')})` }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ─── Alert Sound ─── */
function playAlertSound() {
  try {
    const ctx = new AudioContext();
    [880, 1100, 880].forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = freq; o.type = 'sawtooth';
      g.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.3);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.3 + 0.25);
      o.start(ctx.currentTime + i * 0.3);
      o.stop(ctx.currentTime + i * 0.3 + 0.25);
    });
  } catch { /* no audio */ }
  navigator.vibrate?.([500, 200, 500, 200, 500]);
}

/* ─── Stagger animation ─── */
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const cardAnim = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4 } },
};

const DEVICE_ID = 'esp32-chainpulse-001';

/* ═══════════════════════════════════════════════
   DASHBOARD
   ═══════════════════════════════════════════════ */
export default function Dashboard() {
  const [vitals, setVitals] = useState<Vital | null>(null);
  const [history, setHistory] = useState<Vital[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [activeAlert, setActiveAlert] = useState<FallAlert | null>(null);
  const [unresolvedAlerts, setUnresolvedAlerts] = useState<FallAlert[]>([]);
  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [clock, setClock] = useState(new Date());
  const [secondsAgo, setSecondsAgo] = useState<number | null>(null);
  const [todayCount, setTodayCount] = useState<number>(0);

  /* ── MAIN DATA FETCH + SUBSCRIPTIONS ── */
  useEffect(() => {
    let mounted = true;

    async function init() {
      // Step 1: latest vitals row
      const { data: latest } = await supabase
        .from('vitals')
        .select('*')
        .eq('device_id', DEVICE_ID)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single();

      // Step 2: last 50 for charts
      const { data: hist } = await supabase
        .from('vitals')
        .select('*')
        .eq('device_id', DEVICE_ID)
        .order('recorded_at', { ascending: false })
        .limit(50);

      // Fetch device info
      const { data: dev } = await supabase
        .from('devices')
        .select('*')
        .eq('device_id', DEVICE_ID)
        .single();

      // Fetch unresolved fall alerts
      const { data: alerts } = await supabase
        .from('fall_alerts')
        .select('*')
        .eq('device_id', DEVICE_ID)
        .eq('resolved', false)
        .order('created_at', { ascending: false })
        .limit(5);

      // Today's count
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from('vitals')
        .select('*', { count: 'exact', head: true })
        .eq('device_id', DEVICE_ID)
        .gte('recorded_at', todayStart.toISOString());

      if (!mounted) return;

      if (latest) {
        setVitals(latest as unknown as Vital);
        setLastUpdate(new Date(latest.recorded_at ?? Date.now()));
      }
      if (hist) setHistory((hist as unknown as Vital[]).reverse());
      if (dev) setDevice(dev as unknown as Device);
      if (alerts && alerts.length > 0) {
        setUnresolvedAlerts(alerts as unknown as FallAlert[]);
        setActiveAlert(alerts[0] as unknown as FallAlert);
      }
      setTodayCount(count ?? 0);
      setLoading(false);
    }

    init();

    // Step 3: Subscribe to realtime vitals
    const channel = supabase
      .channel('vitals-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'vitals', filter: `device_id=eq.${DEVICE_ID}` },
        (payload) => {
          const v = payload.new as unknown as Vital;
          setVitals(v);
          setHistory(prev => [...prev.slice(-49), v]);
          setLastUpdate(new Date());
          setTodayCount(prev => prev + 1);
        }
      )
      .subscribe();

    // Step 4: Subscribe to fall alerts
    const alertChannel = supabase
      .channel('fall-alerts-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'fall_alerts' },
        (payload) => {
          const a = payload.new as unknown as FallAlert;
          setActiveAlert(a);
          setUnresolvedAlerts(prev => [a, ...prev]);
          playAlertSound();
        }
      )
      .subscribe();

    // Step 5: Cleanup
    return () => {
      mounted = false;
      supabase.removeChannel(channel);
      supabase.removeChannel(alertChannel);
    };
  }, []);

  /* ── Clock & stale timer ── */
  useEffect(() => {
    const t = setInterval(() => {
      setClock(new Date());
      if (lastUpdate) {
        const diff = Math.round((Date.now() - lastUpdate.getTime()) / 1000);
        setSecondsAgo(diff);
        setIsStale(diff > 15);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [lastUpdate]);

  /* ── Sparkline data ── */
  const sparkHR = useMemo(() => history.slice(-20).map(v => v.heart_rate ?? 0), [history]);
  const sparkSPO2 = useMemo(() => history.slice(-20).map(v => v.spo2 ?? 0), [history]);
  const sparkTemp = useMemo(() => history.slice(-20).map(v => v.temp_body ?? 0), [history]);

  /* ── Chart data ── */
  const chartData = useMemo(() =>
    history.map(d => ({
      time: d.recorded_at ? new Date(d.recorded_at).getTime() : 0,
      heart_rate: d.heart_rate,
      spo2: d.spo2,
      temp_body: d.temp_body,
      temp_ambient: d.temp_ambient,
    })),
    [history]
  );

  /* ── Resolve alert ── */
  const handleResolve = useCallback(async (alertId: number) => {
    await supabase
      .from('fall_alerts')
      .update({ resolved: true, resolved_at: new Date().toISOString() })
      .eq('id', alertId);
    setUnresolvedAlerts(prev => prev.filter(a => a.id !== alertId));
    if (activeAlert?.id === alertId) setActiveAlert(null);
  }, [activeAlert]);

  /* ── CSV Export ── */
  const handleExportCSV = useCallback(async () => {
    const { data } = await supabase
      .from('vitals')
      .select('*')
      .eq('device_id', DEVICE_ID)
      .order('recorded_at', { ascending: false })
      .limit(1000);
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(',')).join('\n');
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `chainpulse-vitals-${format(new Date(), 'yyyy-MM-dd')}.csv`; a.click();
    URL.revokeObjectURL(url);
  }, []);

  /* ── Derived values ── */
  const hr = vitals?.heart_rate ?? null;
  const spo2 = vitals?.spo2 ?? null;
  const tempBody = vitals?.temp_body ?? null;
  const tempAmb = vitals?.temp_ambient ?? null;
  const humidity = vitals?.humidity ?? null;
  const gForce = vitals?.g_force ?? null;
  const roll = vitals?.roll ?? null;
  const pitch = vitals?.pitch ?? null;
  const gyroX = vitals?.gyro_x ?? null;
  const gyroY = vitals?.gyro_y ?? null;
  const gyroZ = vitals?.gyro_z ?? null;
  const fallDetected = vitals?.fall_detected ?? false;

  const hrStatus = getHRStatus(hr);
  const spo2Status = getSPO2Status(spo2);
  const tempStatus = getTempStatus(tempBody);
  const gStatus = getGForceStatus(gForce, fallDetected);

  const isOnline = lastUpdate ? Date.now() - lastUpdate.getTime() < 15000 : false;

  /* ── SPO2 ring constants ── */
  const spo2R = 54;
  const spo2Circ = 2 * Math.PI * spo2R;
  const spo2Offset = spo2 ? spo2Circ - (spo2 / 100) * spo2Circ : spo2Circ;

  /* ── Temp fill height ── */
  const tempFillPct = tempBody ? Math.max(0, Math.min(100, ((tempBody - 35) / 7) * 100)) : 0;
  const tempF = tempBody ? (tempBody * 1.8 + 32).toFixed(1) : '--';
  const tempAmbF = tempAmb ? (tempAmb * 1.8 + 32).toFixed(1) : '--';

  /* ── G-force arc ── */
  const gArcPct = gForce ? Math.min(gForce / 4, 1) : 0;

  return (
    <div className="min-h-screen bg-grid">
      {/* ═══ NAVBAR ═══ */}
      <nav
        className="sticky top-0 z-30 border-b backdrop-blur-xl"
        style={{ borderColor: 'hsl(var(--border))', backgroundColor: 'hsl(var(--surface) / 0.92)' }}
      >
        <div className="max-w-[1440px] mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #00E5FF, #00E676)' }}
            >
              <Activity className="w-5 h-5 text-black" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold leading-none" style={{ color: '#00E5FF' }}>
                ChainPulse
              </h1>
              <p className="text-[10px] font-body leading-none mt-0.5" style={{ color: 'hsl(var(--t3))' }}>
                IoT Health Monitor
              </p>
            </div>
          </div>

          {/* Center clock */}
          <div className="hidden md:flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" style={{ color: 'hsl(var(--t3))' }} />
            <span className="font-mono text-sm" style={{ color: 'hsl(var(--t2))' }}>
              {clock.toLocaleTimeString('en-US', { hour12: false })}
            </span>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-3">
            {/* Live indicator */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono font-bold"
              style={{
                backgroundColor: isOnline ? 'rgba(0,230,118,0.1)' : 'rgba(255,23,68,0.1)',
                color: isOnline ? '#00E676' : '#FF1744',
                border: `1px solid ${isOnline ? 'rgba(0,230,118,0.3)' : 'rgba(255,23,68,0.3)'}`,
              }}
            >
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isOnline ? 'LIVE' : 'OFFLINE'}
            </div>

            {/* Device badge */}
            <span
              className="hidden sm:inline-block px-2.5 py-1 rounded-md text-[10px] font-mono"
              style={{ backgroundColor: 'hsl(var(--elevated))', color: 'hsl(var(--t3))' }}
            >
              {DEVICE_ID}
            </span>

            {/* Last update */}
            <span className="hidden lg:inline-block text-[11px] font-mono" style={{ color: 'hsl(var(--t2))' }}>
              {secondsAgo !== null ? `${secondsAgo}s ago` : '—'}
            </span>

            {/* CSV export */}
            <button
              onClick={handleExportCSV}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'hsl(var(--t2))' }}
              title="Export CSV"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ═══ STALE BANNER ═══ */}
        <AnimatePresence>
          {isStale && !loading && (
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-body"
              style={{ backgroundColor: 'rgba(255,179,0,0.1)', color: '#FFB300', border: '1px solid rgba(255,179,0,0.25)' }}
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              ⚠ No data received for 15+ seconds — ESP32 may be offline or out of range
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ LOADING SKELETONS ═══ */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-52 rounded-2xl" />)}
          </div>
        )}

        {/* ═══ VITALS GRID ═══ */}
        {!loading && (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            initial="hidden" animate="visible" variants={stagger}
          >
            {/* ── CARD 1: Heart Rate ── */}
            <motion.div variants={cardAnim}>
              <div className={cardClass(hrStatus)} style={{ minHeight: 220 }}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'hsl(var(--t3))' }}>Heart Rate</span>
                  <Heart
                    className="w-6 h-6"
                    fill="#FF4444"
                    stroke="#FF4444"
                    style={{
                      animation: hr && hr > 0 ? `heartbeat ${(60 / hr).toFixed(2)}s infinite` : 'none',
                    }}
                  />
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="vital-number text-6xl font-bold" style={{ color: '#FF4444' }}>
                    {hr ?? '--'}
                  </span>
                  <span className="text-sm font-body" style={{ color: 'hsl(var(--t2))' }}>BPM</span>
                </div>
                <StatusBadge status={hrStatus} label={HR_LABELS[hrStatus]} />
                <div className="mt-3">
                  <Sparkline data={sparkHR} color="#FF4444" />
                </div>
              </div>
            </motion.div>

            {/* ── CARD 2: SpO2 ── */}
            <motion.div variants={cardAnim}>
              <div className={cardClass(spo2Status)} style={{ minHeight: 220 }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'hsl(var(--t3))' }}>Blood Oxygen</span>
                </div>
                <div className="flex items-center gap-6">
                  {/* SVG Ring */}
                  <svg width="120" height="120" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r={spo2R} fill="none" stroke="#1A2535" strokeWidth={8} />
                    <circle
                      cx="60" cy="60" r={spo2R} fill="none"
                      stroke={STATUS_COLORS[spo2Status]}
                      strokeWidth={8}
                      strokeDasharray={spo2Circ}
                      strokeDashoffset={spo2Offset}
                      strokeLinecap="round"
                      transform="rotate(-90 60 60)"
                      style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.5s' }}
                    />
                    <text
                      x="60" y="60" textAnchor="middle" dominantBaseline="central"
                      className="vital-number"
                      style={{ fontSize: 22, fill: STATUS_COLORS[spo2Status], fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {spo2 ? `${spo2}%` : '--'}
                    </text>
                  </svg>
                  <div className="flex-1">
                    <StatusBadge status={spo2Status} label={SPO2_LABELS[spo2Status]} />
                    <div className="mt-3">
                      <Sparkline data={sparkSPO2} color="#00E5FF" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ── CARD 3: Body Temperature ── */}
            <motion.div variants={cardAnim}>
              <div className={cardClass(tempStatus)} style={{ minHeight: 220 }}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'hsl(var(--t3))' }}>Body Temperature</span>
                  <Thermometer className="w-5 h-5" style={{ color: '#FF6D00' }} />
                </div>
                <div className="flex items-center gap-5">
                  {/* SVG Thermometer */}
                  <svg width="32" height="100" viewBox="0 0 32 100">
                    <rect x="10" y="5" width="12" height="70" rx="6" fill="#1A2535" />
                    <rect
                      x="10" width="12" rx="6" fill="#FF6D00"
                      y={5 + 70 * (1 - tempFillPct / 100)}
                      height={70 * (tempFillPct / 100)}
                      style={{ transition: 'y 0.5s ease, height 0.5s ease' }}
                    />
                    <circle cx="16" cy="88" r="10" fill="#FF6D00" />
                  </svg>
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="vital-number text-5xl font-bold" style={{ color: '#FF6D00' }}>
                        {tempBody !== null ? Number(tempBody).toFixed(1) : '--'}
                      </span>
                      <span className="text-lg font-body" style={{ color: 'hsl(var(--t2))' }}>°C</span>
                    </div>
                    <div className="text-xs font-mono mt-1" style={{ color: 'hsl(var(--t3))' }}>
                      ({tempF}°F)
                    </div>
                    <div className="mt-2">
                      <StatusBadge status={tempStatus} label={TEMP_LABELS[tempStatus]} />
                    </div>
                  </div>
                </div>
                <div className="mt-2">
                  <Sparkline data={sparkTemp} color="#FF6D00" />
                </div>
              </div>
            </motion.div>

            {/* ── CARD 4: Ambient Environment ── */}
            <motion.div variants={cardAnim}>
              <div className="cp-card" style={{ minHeight: 220 }}>
                <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'hsl(var(--t3))' }}>
                  Environment (DHT22)
                </span>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {/* Left: ambient temp */}
                  <div>
                    <div className="text-[9px] font-mono uppercase mb-2" style={{ color: 'hsl(var(--t3))' }}>Ambient</div>
                    <div className="flex items-baseline gap-1">
                      <span className="vital-number text-4xl font-bold" style={{ color: '#00BCD4' }}>
                        {tempAmb !== null ? Number(tempAmb).toFixed(1) : '--'}
                      </span>
                      <span className="text-sm" style={{ color: 'hsl(var(--t2))' }}>°C</span>
                    </div>
                    <div className="text-[10px] font-mono" style={{ color: 'hsl(var(--t3))' }}>({tempAmbF}°F)</div>
                  </div>
                  {/* Right: humidity with wave */}
                  <div className="flex flex-col items-center">
                    <div className="text-[9px] font-mono uppercase mb-2 self-start" style={{ color: 'hsl(var(--t3))' }}>Humidity</div>
                    <div className="relative w-16 h-16 rounded-full overflow-hidden" style={{ border: '2px solid #00BCD4' }}>
                      <div
                        className="absolute bottom-0 w-full transition-all duration-700"
                        style={{ height: `${humidity ?? 0}%`, backgroundColor: 'rgba(0,188,212,0.3)' }}
                      >
                        <div className="wave-anim w-[200%] h-2 absolute -top-1" style={{
                          background: 'radial-gradient(ellipse at 25% 50%, rgba(0,188,212,0.4) 0%, transparent 50%)',
                        }} />
                      </div>
                    </div>
                    <span className="vital-number text-2xl font-bold mt-1" style={{ color: '#00BCD4' }}>
                      {humidity !== null ? Number(humidity).toFixed(0) : '--'}%
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ── CARD 5: Motion / Fall Detection ── */}
            <motion.div variants={cardAnim}>
              <div className={cardClass(gStatus)} style={{ minHeight: 220 }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'hsl(var(--t3))' }}>Motion (MPU6050)</span>
                  <StatusBadge status={gStatus} label={GFORCE_LABELS[gStatus]} />
                </div>
                <div className="flex items-start gap-4">
                  {/* 3D device silhouette */}
                  <div className="flex items-center justify-center pt-2">
                    <div
                      style={{
                        width: 56, height: 90,
                        background: 'hsl(var(--elevated))',
                        border: '1.5px solid #00E5FF',
                        borderRadius: 8,
                        boxShadow: '0 0 16px rgba(0,229,255,0.3)',
                        transform: `perspective(400px) rotateX(${-(pitch ?? 0)}deg) rotateY(${roll ?? 0}deg)`,
                        transition: 'transform 0.3s ease',
                        transformStyle: 'preserve-3d',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Cpu className="w-5 h-5" style={{ color: '#00E5FF', opacity: 0.5 }} />
                    </div>
                  </div>
                  {/* Values grid */}
                  <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs font-mono">
                    <div>
                      <span style={{ color: 'hsl(var(--t3))' }}>G-Force</span>
                      <div className="vital-number text-lg font-bold" style={{ color: gForce && gForce > 2 ? '#FF1744' : '#7C4DFF' }}>
                        {gForce !== null ? Number(gForce).toFixed(2) : '--'}g
                      </div>
                    </div>
                    <div>
                      <span style={{ color: 'hsl(var(--t3))' }}>Roll</span>
                      <div style={{ color: 'hsl(var(--t1))' }}>{roll !== null ? `${Number(roll).toFixed(1)}°` : '--'}</div>
                    </div>
                    <div>
                      <span style={{ color: 'hsl(var(--t3))' }}>Pitch</span>
                      <div style={{ color: 'hsl(var(--t1))' }}>{pitch !== null ? `${Number(pitch).toFixed(1)}°` : '--'}</div>
                    </div>
                    <div>
                      <span style={{ color: 'hsl(var(--t3))' }}>Gyro</span>
                      <div className="text-[10px]" style={{ color: 'hsl(var(--t2))' }}>
                        {gyroX !== null ? `X:${Number(gyroX).toFixed(0)}` : '--'}{' '}
                        {gyroY !== null ? `Y:${Number(gyroY).toFixed(0)}` : ''}{' '}
                        {gyroZ !== null ? `Z:${Number(gyroZ).toFixed(0)}` : ''}
                      </div>
                    </div>
                  </div>
                </div>
                {/* G-Force arc gauge */}
                <div className="mt-3 flex justify-center">
                  <svg width="140" height="36" viewBox="0 0 140 36">
                    <path d="M10 34 A60 60 0 0 1 130 34" fill="none" stroke="#1A2535" strokeWidth={6} strokeLinecap="round" />
                    <path
                      d="M10 34 A60 60 0 0 1 130 34"
                      fill="none"
                      stroke={gForce && gForce > 2 ? '#FF1744' : gForce && gForce > 1 ? '#FFB300' : '#00E676'}
                      strokeWidth={6}
                      strokeLinecap="round"
                      strokeDasharray={`${gArcPct * 188} 188`}
                      style={{ transition: 'stroke-dasharray 0.5s ease' }}
                    />
                  </svg>
                </div>
              </div>
            </motion.div>

            {/* ── CARD 6: Device Status ── */}
            <motion.div variants={cardAnim}>
              <div className="cp-card" style={{ minHeight: 220 }}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'hsl(var(--t3))' }}>Device Status</span>
                  <Cpu className="w-5 h-5" style={{ color: 'hsl(var(--t2))' }} />
                </div>

                {/* Row 1: Device info */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: isOnline ? '#00E676' : '#FF1744', animation: isOnline ? 'criticalPulse 2s infinite' : 'none' }} />
                  <span className="text-sm font-body font-medium" style={{ color: 'hsl(var(--t1))' }}>ESP32-C3 Super Mini</span>
                </div>

                {/* Row 2: Cloud sync */}
                <div className="flex items-center gap-2 mb-2 text-xs font-mono" style={{ color: 'hsl(var(--t2))' }}>
                  <Cloud className="w-3.5 h-3.5" style={{ color: isOnline ? '#00E676' : '#FFB300' }} />
                  <span>Last synced: {secondsAgo !== null ? `${secondsAgo}s ago` : 'never'}</span>
                </div>

                {/* Row 3: Firmware */}
                <div className="flex items-center gap-2 mb-2 text-xs font-mono" style={{ color: 'hsl(var(--t3))' }}>
                  <span className="px-2 py-0.5 rounded" style={{ backgroundColor: 'hsl(var(--elevated))' }}>
                    FW {device?.firmware_ver ?? '—'}
                  </span>
                  <span className="px-2 py-0.5 rounded" style={{ backgroundColor: 'hsl(var(--elevated))' }}>
                    {device?.is_online ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>

                {/* Row 4: Today count */}
                <div className="flex items-center gap-2 mb-3 text-xs font-mono" style={{ color: 'hsl(var(--t2))' }}>
                  <Activity className="w-3.5 h-3.5" style={{ color: '#00E5FF' }} />
                  <span className="vital-number" style={{ color: '#00E5FF' }}>{todayCount}</span>
                  <span>readings today</span>
                </div>

                {/* Row 5: BLE note */}
                <div className="flex items-center gap-2 text-[10px] font-body rounded-lg px-3 py-2" style={{ backgroundColor: 'hsl(var(--elevated))', color: 'hsl(var(--t3))' }}>
                  <Bluetooth className="w-3 h-3" style={{ color: '#7C4DFF' }} />
                  Data via Supabase Realtime — no BLE needed
                </div>

                {!vitals && !loading && (
                  <div className="mt-3 text-xs font-body text-center py-3 rounded-lg" style={{ backgroundColor: 'rgba(255,179,0,0.1)', color: '#FFB300' }}>
                    Waiting for device…
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ═══ CHARTS ═══ */}
        {!loading && history.length > 0 && (
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          >
            <h2 className="font-display text-lg font-bold flex items-center gap-2" style={{ color: 'hsl(var(--t2))' }}>
              <span className="w-1 h-5 rounded-full" style={{ backgroundColor: '#00E5FF' }} />
              VITALS HISTORY
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartCard title="Heart Rate" data={chartData} dataKey="heart_rate" color="#FF4444" unit=" BPM" domain={[40, 160]} />
              <ChartCard title="SpO₂" data={chartData} dataKey="spo2" color="#00E5FF" unit="%" domain={[85, 100]} />
              <ChartCard title="Temperature" data={chartData} dataKey="temp_body" color="#FF6D00" unit="°C" domain={[20, 42]} secondaryKey="temp_ambient" secondaryColor="#00BCD4" />
            </div>
          </motion.div>
        )}

        {/* ═══ FALL ALERTS LIST ═══ */}
        {!loading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <h2 className="font-display text-lg font-bold flex items-center gap-2 mb-3" style={{ color: 'hsl(var(--t2))' }}>
              <span className="w-1 h-5 rounded-full" style={{ backgroundColor: '#FF1744' }} />
              FALL ALERTS
            </h2>
            {unresolvedAlerts.length === 0 ? (
              <div className="cp-card flex items-center gap-3 py-4">
                <CheckCircle className="w-5 h-5" style={{ color: '#00E676' }} />
                <span className="text-sm font-body" style={{ color: 'hsl(var(--t2))' }}>All clear — no falls detected</span>
              </div>
            ) : (
              <div className="space-y-2">
                {unresolvedAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className="cp-card cp-card-critical flex items-center justify-between gap-4 py-3"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#FF1744', animation: 'criticalPulse 1.5s infinite' }} />
                      <span className="text-xs font-mono" style={{ color: 'hsl(var(--t2))' }}>
                        {alert.created_at ? format(new Date(alert.created_at), 'HH:mm:ss') : '--'}
                      </span>
                      <span className="text-xs font-mono" style={{ color: 'hsl(var(--t1))' }}>
                        G={Number(alert.g_force ?? 0).toFixed(2)}g
                      </span>
                      <span className="text-xs font-mono" style={{ color: 'hsl(var(--t1))' }}>
                        Roll={Number(alert.roll ?? 0).toFixed(1)}°
                      </span>
                      <span className="text-xs font-mono" style={{ color: 'hsl(var(--t1))' }}>
                        Pitch={Number(alert.pitch ?? 0).toFixed(1)}°
                      </span>
                    </div>
                    <button
                      onClick={() => handleResolve(alert.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 flex-shrink-0"
                      style={{ backgroundColor: 'rgba(0,230,118,0.15)', color: '#00E676', border: '1px solid rgba(0,230,118,0.3)' }}
                    >
                      <ShieldCheck className="w-3 h-3" />
                      Resolve
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Footer */}
        <div className="text-center text-[10px] font-body pt-4 pb-2 border-t" style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--t3))' }}>
          ChainPulse • ESP32 → Supabase Realtime • Device: {DEVICE_ID}
        </div>
      </main>

      {/* ═══ FALL ALERT MODAL ═══ */}
      <AnimatePresence>
        {activeAlert && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(255,23,68,0.1)', backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="cp-card max-w-md w-full mx-4 p-8 text-center"
              style={{ border: '2px solid #FF1744', borderRadius: 16 }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
            >
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="font-display text-5xl font-bold mb-2" style={{ color: '#FF1744' }}>FALL DETECTED</h2>
              <p className="text-sm font-body mb-6" style={{ color: 'hsl(var(--t2))' }}>Immediate attention required</p>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: 'G-Force', val: `${Number(activeAlert.g_force ?? 0).toFixed(2)}g` },
                  { label: 'Roll', val: `${Number(activeAlert.roll ?? 0).toFixed(1)}°` },
                  { label: 'Pitch', val: `${Number(activeAlert.pitch ?? 0).toFixed(1)}°` },
                ].map(({ label, val }) => (
                  <div key={label} className="rounded-lg p-3" style={{ backgroundColor: 'hsl(var(--elevated))' }}>
                    <div className="text-[9px] font-mono uppercase mb-1" style={{ color: 'hsl(var(--t3))' }}>{label}</div>
                    <div className="vital-number text-lg font-bold" style={{ color: 'hsl(var(--t1))' }}>{val}</div>
                  </div>
                ))}
              </div>

              <div className="text-xs font-mono mb-6" style={{ color: 'hsl(var(--t3))' }}>
                {activeAlert.created_at ? format(new Date(activeAlert.created_at), 'PPpp') : '--'}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleResolve(activeAlert.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-display font-bold text-sm"
                  style={{ backgroundColor: '#00E676', color: '#000' }}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Mark as Safe
                </button>
                <button
                  onClick={() => setActiveAlert(null)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-display font-bold text-sm border"
                  style={{ borderColor: 'hsl(var(--border-hi))', color: 'hsl(var(--t1))' }}
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══ Chart Card sub-component ═══ */
function ChartCard({
  title, data, dataKey, color, unit, domain, secondaryKey, secondaryColor,
}: {
  title: string;
  data: Record<string, unknown>[];
  dataKey: string;
  color: string;
  unit: string;
  domain?: [number, number];
  secondaryKey?: string;
  secondaryColor?: string;
}) {
  const gradId = `grad-${dataKey}`;

  if (secondaryKey) {
    return (
      <div className="cp-card">
        <div className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: 'hsl(var(--t3))' }}>{title}</div>
        <div className="h-[150px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1A2535" strokeDasharray="3 3" />
              <XAxis dataKey="time" tickFormatter={(v: number) => new Date(v).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} tick={{ fontSize: 10, fill: '#3D4756' }} axisLine={false} tickLine={false} />
              <YAxis domain={domain} tick={{ fontSize: 10, fill: '#3D4756' }} axisLine={false} tickLine={false} width={35} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1A2535', borderRadius: 8, fontSize: 12, color: '#E6EDF3' }} labelFormatter={(v: number) => new Date(v).toLocaleTimeString()} formatter={(val: number, name: string) => [`${val}${unit}`, name]} />
              <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#${gradId})`} dot={false} animationDuration={600} />
              <Line type="monotone" dataKey={secondaryKey} stroke={secondaryColor} strokeWidth={2} dot={false} animationDuration={600} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-4 mt-2 text-[10px] font-mono" style={{ color: 'hsl(var(--t3))' }}>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block" style={{ backgroundColor: color }} />Body</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block" style={{ backgroundColor: secondaryColor }} />Ambient</span>
        </div>
      </div>
    );
  }

  return (
    <div className="cp-card">
      <div className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: 'hsl(var(--t3))' }}>{title}</div>
      <div className="h-[150px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
              <filter id={`glow-${dataKey}`}>
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <CartesianGrid stroke="#1A2535" strokeDasharray="3 3" />
            <XAxis dataKey="time" tickFormatter={(v: number) => new Date(v).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} tick={{ fontSize: 10, fill: '#3D4756' }} axisLine={false} tickLine={false} />
            <YAxis domain={domain} tick={{ fontSize: 10, fill: '#3D4756' }} axisLine={false} tickLine={false} width={35} />
            <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1A2535', borderRadius: 8, fontSize: 12, color: '#E6EDF3' }} labelFormatter={(v: number) => new Date(v).toLocaleTimeString()} formatter={(val: number) => [`${val}${unit}`, title]} />
            <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#${gradId})`} dot={false} animationDuration={600} style={{ filter: `url(#glow-${dataKey})` }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

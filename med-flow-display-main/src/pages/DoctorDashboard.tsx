import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Users, AlertTriangle, Settings as SettingsIcon,
  LogOut, CheckCircle, Download, Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { subscribeAllVitals, fetchActiveAlerts, resolveFallAlert } from '@/supabase/vitals';
import { STATUS_COLORS, getHRStatus, getSPO2Status, getTempStatus, getStatusLabel } from '@/utils/status';
import type { Vital, FallAlert, Profile } from '@/types/database';
import { formatDistanceToNow } from 'date-fns';

type Tab = 'overview' | 'patients' | 'alerts' | 'settings';

export default function DoctorDashboard() {
  const { user, profile, logout } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [patients, setPatients] = useState<(Profile & { latestVital?: Vital })[]>([]);
  const [alerts, setAlerts] = useState<FallAlert[]>([]);
  const [latestVitalsMap, setLatestVitalsMap] = useState<Map<string, Vital>>(new Map());
  const [selectedPatient, setSelectedPatient] = useState<Profile | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Fetch patients
  useEffect(() => {
    supabase.from('profiles').select('*').eq('role', 'patient')
      .then(({ data }) => {
        if (data) setPatients(data as unknown as Profile[]);
      });
  }, []);

  // Fetch alerts
  useEffect(() => {
    fetchActiveAlerts().then(setAlerts).catch(() => {});
    const channel = supabase
      .channel('doctor-alerts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'fall_alerts' },
        (payload) => setAlerts(prev => [payload.new as unknown as FallAlert, ...prev]))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Subscribe to all vitals
  useEffect(() => {
    const channel = subscribeAllVitals((vital) => {
      setLatestVitalsMap(prev => {
        const next = new Map(prev);
        next.set(vital.device_id, vital);
        return next;
      });
    });
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Fetch latest vitals
  useEffect(() => {
    supabase.from('latest_vitals').select('*').then(({ data }) => {
      if (data) {
        const map = new Map<string, Vital>();
        (data as unknown as Vital[]).forEach(v => map.set(v.device_id, v));
        setLatestVitalsMap(map);
      }
    });
  }, []);

  const stats = useMemo(() => ({
    totalPatients: patients.length,
    activeAlerts: alerts.filter(a => !a.resolved).length,
    onlineDevices: Array.from(latestVitalsMap.values()).filter(v => {
      if (!v.recorded_at) return false;
      return Date.now() - new Date(v.recorded_at).getTime() < 30000;
    }).length,
    criticalCases: Array.from(latestVitalsMap.values()).filter(v =>
      getHRStatus(v.heart_rate) === 'critical' || getSPO2Status(v.spo2) === 'critical'
    ).length,
  }), [patients, alerts, latestVitalsMap]);

  const handleResolve = async (alertId: number) => {
    if (!user) return;
    try {
      await resolveFallAlert(alertId, user.id);
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    } catch { /* */ }
  };

  const handleSaveNote = async () => {
    if (!selectedPatient || !user || !noteContent.trim()) return;
    setSavingNote(true);
    await supabase.from('doctor_notes').insert({
      patient_id: selectedPatient.id,
      doctor_id: user.id,
      content: noteContent.trim(),
    });
    setNoteContent('');
    setSavingNote(false);
  };

  const handleExportCSV = async () => {
    const { data } = await supabase.from('vitals').select('*').order('recorded_at', { ascending: false }).limit(1000);
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(',')).join('\n');
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'vitals-export.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const navItems: { id: Tab; icon: typeof LayoutDashboard; label: string; badge?: number }[] = [
    { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
    { id: 'patients', icon: Users, label: 'Patients' },
    { id: 'alerts', icon: AlertTriangle, label: 'Alerts', badge: stats.activeAlerts },
    { id: 'settings', icon: SettingsIcon, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-grid flex">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-60 border-r p-4" style={{ borderColor: 'hsl(var(--border))', backgroundColor: 'hsl(var(--surface))' }}>
        <h1 className="font-display text-xl font-bold mb-8" style={{ color: 'var(--cyan-raw)' }}>ChainPulse</h1>
        <nav className="flex-1 space-y-1">
          {navItems.map(({ id, icon: Icon, label, badge }) => (
            <button
              key={id}
              onClick={() => { setTab(id); setSelectedPatient(null); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body transition-all"
              style={{
                backgroundColor: tab === id ? 'hsl(var(--elevated))' : 'transparent',
                color: tab === id ? 'var(--cyan-raw)' : 'hsl(var(--t2))',
              }}
            >
              <Icon className="w-4 h-4" />
              {label}
              {badge !== undefined && badge > 0 && (
                <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'var(--red-raw)', color: '#fff' }}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </nav>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 text-sm font-body text-t3 hover:text-t1 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 flex border-t" style={{ borderColor: 'hsl(var(--border))', backgroundColor: 'hsl(var(--surface))' }}>
        {navItems.map(({ id, icon: Icon, label, badge }) => (
          <button
            key={id}
            onClick={() => { setTab(id); setSelectedPatient(null); }}
            className="flex-1 flex flex-col items-center py-2 text-[10px] font-body relative"
            style={{ color: tab === id ? 'var(--cyan-raw)' : 'hsl(var(--t3))' }}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            {label}
            {badge !== undefined && badge > 0 && (
              <span className="absolute top-1 right-1/4 w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--red-raw)' }} />
            )}
          </button>
        ))}
      </nav>

      {/* Main content */}
      <main className="flex-1 p-6 pb-20 md:pb-6 overflow-auto">
        {tab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <h2 className="font-display text-2xl font-bold text-t1">Dashboard Overview</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Patients', value: stats.totalPatients, color: 'var(--cyan-raw)' },
                { label: 'Active Alerts', value: stats.activeAlerts, color: 'var(--red-raw)' },
                { label: 'Online Devices', value: stats.onlineDevices, color: 'var(--green-raw)' },
                { label: 'Critical Cases', value: stats.criticalCases, color: 'var(--amber-raw)' },
              ].map(({ label, value, color }) => (
                <div key={label} className="cp-card text-center">
                  <div className="text-xs text-t3 font-body uppercase mb-2">{label}</div>
                  <motion.div
                    className="text-4xl font-mono font-bold vital-number"
                    style={{ color }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {value}
                  </motion.div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {tab === 'patients' && !selectedPatient && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <h2 className="font-display text-2xl font-bold text-t1">Patients</h2>
            {patients.length === 0 ? (
              <div className="cp-card p-8 text-center text-t3 font-body">No patients registered yet.</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {patients.map(p => {
                  const vital = latestVitalsMap.get(p.assigned_device ?? '');
                  const hrStatus = vital ? getHRStatus(vital.heart_rate) : 'unknown';
                  const spo2Status = vital ? getSPO2Status(vital.spo2) : 'unknown';
                  const tempStatus = vital ? getTempStatus(vital.temp_body) : 'unknown';
                  const worstStatus = [hrStatus, spo2Status, tempStatus].includes('critical') ? 'critical'
                    : [hrStatus, spo2Status, tempStatus].includes('warning') ? 'warning' : 'normal';

                  return (
                    <div key={p.id} className="cp-card flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-display font-bold flex-shrink-0"
                        style={{ border: `2px solid ${STATUS_COLORS[worstStatus]}`, color: STATUS_COLORS[worstStatus] }}
                      >
                        {p.full_name?.charAt(0) ?? '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-display font-bold text-t1 truncate">{p.full_name}</div>
                        <div className="text-xs text-t3 font-body">{p.blood_type ?? 'Unknown type'}</div>
                        <div className="flex gap-2 mt-1.5">
                          {vital && (
                            <>
                              <MiniVitalBadge label="HR" value={vital.heart_rate} status={hrStatus} />
                              <MiniVitalBadge label="SpO2" value={vital.spo2} status={spo2Status} />
                              <MiniVitalBadge label="Temp" value={vital.temp_body ? Number(vital.temp_body.toFixed(1)) : null} status={tempStatus} />
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedPatient(p)}
                        className="text-xs font-display font-bold px-3 py-1.5 rounded-lg"
                        style={{ color: 'var(--cyan-raw)', backgroundColor: 'var(--cyan-glow)' }}
                      >
                        View
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {tab === 'patients' && selectedPatient && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <button onClick={() => setSelectedPatient(null)} className="text-sm text-t2 hover:text-cyan font-body">← Back to patients</button>
            <h2 className="font-display text-2xl font-bold text-t1">{selectedPatient.full_name}</h2>
            <div className="cp-card">
              <h3 className="font-display font-bold text-t1 mb-3">Doctor Notes</h3>
              <textarea
                className="w-full h-24 px-3 py-2 rounded-lg bg-elevated border border-border text-t1 font-body text-sm resize-none focus:outline-none focus:border-cyan"
                placeholder="Add clinical notes..."
                value={noteContent}
                onChange={e => setNoteContent(e.target.value)}
              />
              <button
                onClick={handleSaveNote}
                disabled={savingNote || !noteContent.trim()}
                className="mt-2 px-4 py-2 rounded-lg text-sm font-display font-bold disabled:opacity-50"
                style={{ backgroundColor: 'var(--cyan-raw)', color: 'hsl(var(--void))' }}
              >
                {savingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Note'}
              </button>
            </div>
          </motion.div>
        )}

        {tab === 'alerts' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <h2 className="font-display text-2xl font-bold text-t1">Active Alerts</h2>
            {alerts.filter(a => !a.resolved).length === 0 ? (
              <div className="cp-card p-12 text-center">
                <CheckCircle className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--green-raw)' }} />
                <p className="font-display text-xl font-bold text-t1">All clear</p>
                <p className="text-sm text-t2 font-body mt-1">No active fall alerts.</p>
              </div>
            ) : (
              alerts.filter(a => !a.resolved).map(alert => (
                <div key={alert.id} className="cp-card cp-card-critical flex items-center gap-4">
                  <AlertTriangle className="w-6 h-6 flex-shrink-0" style={{ color: 'var(--red-raw)' }} />
                  <div className="flex-1">
                    <div className="font-display font-bold text-t1">{alert.patient_name ?? alert.device_id}</div>
                    <div className="text-xs text-t2 font-mono">
                      G: {alert.g_force?.toFixed(2)} | R: {alert.roll?.toFixed(1)}° | P: {alert.pitch?.toFixed(1)}°
                    </div>
                    <div className="text-xs text-t3 font-body mt-0.5">
                      {alert.created_at ? formatDistanceToNow(new Date(alert.created_at), { addSuffix: true }) : ''}
                    </div>
                  </div>
                  <button
                    onClick={() => handleResolve(alert.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-display font-bold"
                    style={{ backgroundColor: 'var(--green-raw)', color: '#000' }}
                  >
                    Resolve
                  </button>
                </div>
              ))
            )}
          </motion.div>
        )}

        {tab === 'settings' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <h2 className="font-display text-2xl font-bold text-t1">Settings</h2>
            <div className="cp-card">
              <h3 className="font-display font-bold text-t1 mb-3">Export Data</h3>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-display font-bold"
                style={{ backgroundColor: 'var(--cyan-raw)', color: 'hsl(var(--void))' }}
              >
                <Download className="w-4 h-4" /> Export Vitals CSV
              </button>
            </div>
            <div className="cp-card">
              <h3 className="font-display font-bold text-t1 mb-3">Profile</h3>
              <div className="grid grid-cols-2 gap-3 text-sm font-body">
                <div><span className="text-t3">Name:</span> <span className="text-t1">{profile?.full_name}</span></div>
                <div><span className="text-t3">Role:</span> <span className="text-t1 capitalize">{profile?.role}</span></div>
                <div><span className="text-t3">Specialization:</span> <span className="text-t1">{profile?.specialization ?? 'N/A'}</span></div>
                <div><span className="text-t3">Hospital:</span> <span className="text-t1">{profile?.hospital ?? 'N/A'}</span></div>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}

function MiniVitalBadge({ label, value, status }: { label: string; value: number | null; status: string }) {
  return (
    <span
      className="text-[10px] font-mono px-1.5 py-0.5 rounded"
      style={{ color: STATUS_COLORS[status as keyof typeof STATUS_COLORS], backgroundColor: `${STATUS_COLORS[status as keyof typeof STATUS_COLORS]}20` }}
    >
      {label}: {value ?? '--'}
    </span>
  );
}

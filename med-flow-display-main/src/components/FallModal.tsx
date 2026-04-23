import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Phone, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import type { FallAlert } from '@/types/database';

interface FallModalProps {
  alert: FallAlert | null;
  emergencyContact?: string | null;
  onResolve: () => void;
}

function playAlertSound() {
  try {
    const ctx = new AudioContext();
    [880, 1100, 880].forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.frequency.value = freq;
      o.type = 'sawtooth';
      g.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.3);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.3 + 0.25);
      o.start(ctx.currentTime + i * 0.3);
      o.stop(ctx.currentTime + i * 0.3 + 0.25);
    });
    navigator.vibrate?.([500, 200, 500, 200, 500]);
  } catch {
    // Audio not available
  }
}

export function FallModal({ alert, emergencyContact, onResolve }: FallModalProps) {
  return (
    <AnimatePresence>
      {alert && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(255,23,68,0.08)', backdropFilter: 'blur(8px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onAnimationStart={() => playAlertSound()}
        >
          <motion.div
            className="cp-card cp-card-critical max-w-md w-full mx-4 p-8 text-center"
            style={{ border: '2px solid var(--red-raw)', borderRadius: '1rem' }}
            initial={{ scale: 0.8, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 40, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
          >
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="font-display text-5xl font-extrabold mb-4" style={{ color: 'var(--red-raw)' }}>
              FALL DETECTED
            </h2>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: 'G-Force', val: alert.g_force?.toFixed(2) ?? '--' },
                { label: 'Roll', val: `${alert.roll?.toFixed(1) ?? '--'}°` },
                { label: 'Pitch', val: `${alert.pitch?.toFixed(1) ?? '--'}°` },
              ].map(({ label, val }) => (
                <div key={label} className="bg-elevated rounded-lg p-3">
                  <div className="text-[10px] text-t3 uppercase mb-1">{label}</div>
                  <div className="text-lg font-mono font-bold text-t1">{val}</div>
                </div>
              ))}
            </div>

            <div className="text-xs text-t3 mb-6 font-mono">
              {alert.created_at ? format(new Date(alert.created_at), 'PPpp') : 'Unknown time'}
            </div>

            <div className="flex gap-3">
              {emergencyContact && (
                <a
                  href={`tel:${emergencyContact}`}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-display font-bold text-sm"
                  style={{ backgroundColor: 'var(--red-raw)', color: '#fff' }}
                >
                  <Phone className="w-4 h-4" />
                  Call Emergency
                </a>
              )}
              <button
                onClick={onResolve}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border font-display font-bold text-sm text-t1"
                style={{ borderColor: 'hsl(var(--border-hi))' }}
              >
                <ShieldCheck className="w-4 h-4" />
                Mark Safe
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

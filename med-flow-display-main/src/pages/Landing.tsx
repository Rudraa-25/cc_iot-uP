import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Shield, Stethoscope } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function Landing() {
  const [vitalCount, setVitalCount] = useState(0);

  useEffect(() => {
    supabase.from('vitals').select('id', { count: 'exact', head: true }).then(({ count }) => {
      if (count) animateCount(count);
    });
  }, []);

  function animateCount(target: number) {
    let current = 0;
    const step = Math.max(1, Math.floor(target / 60));
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { current = target; clearInterval(timer); }
      setVitalCount(current);
    }, 16);
  }

  // ECG path
  const ecgPath = "M0,50 L30,50 L35,50 L40,20 L45,80 L50,10 L55,90 L60,50 L65,50 L100,50 L130,50 L135,50 L140,20 L145,80 L150,10 L155,90 L160,50 L165,50 L200,50";

  return (
    <div className="min-h-screen bg-grid relative overflow-hidden">
      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-[100px] pointer-events-none"
        style={{ background: 'var(--cyan-raw)', animation: 'orbFloat1 20s ease-in-out infinite' }} />
      <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full opacity-15 blur-[100px] pointer-events-none"
        style={{ background: 'var(--purple-raw)', animation: 'orbFloat2 25s ease-in-out infinite' }} />
      <div className="absolute bottom-1/4 left-1/3 w-72 h-72 rounded-full opacity-15 blur-[100px] pointer-events-none"
        style={{ background: 'var(--green-raw)', animation: 'orbFloat3 22s ease-in-out infinite' }} />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        {/* Logo + Title */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* ECG SVG */}
          <div className="mb-6">
            <svg viewBox="0 0 200 100" className="w-64 h-16 mx-auto" style={{ filter: 'drop-shadow(0 0 10px var(--cyan-raw))' }}>
              <path
                d={ecgPath}
                fill="none"
                stroke="var(--cyan-raw)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="400"
                strokeDashoffset="400"
                style={{ animation: 'ecgDraw 2s ease-out forwards' }}
              />
            </svg>
          </div>

          <h1 className="font-display text-7xl md:text-8xl font-extrabold tracking-tight" style={{ color: 'var(--cyan-raw)' }}>
            ChainPulse
          </h1>
          <p className="text-lg font-body text-t2 mt-4 max-w-md mx-auto">
            Real-time health monitoring. Real peace of mind.
          </p>
        </motion.div>

        {/* Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Link
            to="/login?role=patient"
            className="px-8 py-3 rounded-xl font-display font-bold text-lg border-2 transition-all hover:shadow-lg"
            style={{ borderColor: 'var(--cyan-raw)', color: 'var(--cyan-raw)' }}
          >
            Patient Portal
          </Link>
          <Link
            to="/login?role=doctor"
            className="px-8 py-3 rounded-xl font-display font-bold text-lg transition-all hover:shadow-lg"
            style={{ backgroundColor: 'var(--cyan-raw)', color: 'hsl(var(--void))' }}
          >
            Doctor Portal
          </Link>
        </motion.div>

        {/* Vital count */}
        {vitalCount > 0 && (
          <motion.div
            className="text-sm font-mono text-t2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <span className="text-cyan font-bold">{vitalCount.toLocaleString()}</span> vitals recorded
          </motion.div>
        )}

        {/* Feature cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-4xl w-full"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.15 } },
          }}
        >
          {[
            { icon: Heart, title: 'Real-time Vitals', desc: 'Heart rate, SpO2, temperature — streamed live from your wearable device via BLE.', color: 'var(--red-raw)' },
            { icon: Shield, title: 'Fall Detection', desc: 'Instant alerts with G-force data. Emergency contacts notified automatically.', color: 'var(--amber-raw)' },
            { icon: Stethoscope, title: 'Doctor Dashboard', desc: 'Monitor all patients, review vitals history, and add clinical notes.', color: 'var(--cyan-raw)' },
          ].map(({ icon: Icon, title, desc, color }) => (
            <motion.div
              key={title}
              className="cp-card p-6 text-center"
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
              }}
            >
              <Icon className="w-8 h-8 mx-auto mb-3" style={{ color }} />
              <h3 className="font-display text-xl font-bold text-t1 mb-2">{title}</h3>
              <p className="text-sm text-t2 font-body">{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

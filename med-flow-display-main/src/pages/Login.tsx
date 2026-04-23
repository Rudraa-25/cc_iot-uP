import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [role, setRole] = useState<'patient' | 'doctor'>((searchParams.get('role') as 'patient' | 'doctor') || 'patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      toast({ title: 'Welcome back!', description: 'Logged in successfully.' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // ECG path
  const ecgPath = "M0,50 L20,50 L25,50 L28,20 L32,80 L35,10 L38,90 L42,50 L50,50 L60,50 L65,50 L68,20 L72,80 L75,10 L78,90 L82,50 L90,50 L100,50";

  return (
    <div className="min-h-screen bg-grid flex">
      {/* Left hero — hidden on mobile */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 blur-[80px]" style={{ background: 'radial-gradient(circle, var(--cyan-raw), transparent)' }} />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
        >
          <svg viewBox="0 0 100 100" className="w-80 h-40" style={{ filter: 'drop-shadow(0 0 15px var(--cyan-raw))' }}>
            <path d={ecgPath} fill="none" stroke="var(--cyan-raw)" strokeWidth="2" strokeLinecap="round"
              strokeDasharray="300" strokeDashoffset="300"
              style={{ animation: 'ecgDraw 2.5s ease-out forwards' }} />
          </svg>
          <h2 className="font-display text-4xl font-extrabold text-center mt-6" style={{ color: 'var(--cyan-raw)' }}>
            ChainPulse
          </h2>
          <p className="text-center text-t2 text-sm mt-2 font-body">Monitoring health, saving lives.</p>
        </motion.div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-display text-3xl font-bold text-t1 mb-2">Sign In</h1>
          <p className="text-sm text-t2 mb-8 font-body">Access your {role} dashboard</p>

          {/* Role toggle */}
          <div className="flex gap-2 mb-6 p-1 rounded-xl bg-elevated">
            {(['patient', 'doctor'] as const).map(r => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className="flex-1 py-2 rounded-lg text-sm font-display font-bold capitalize transition-all"
                style={{
                  backgroundColor: role === r ? 'var(--cyan-raw)' : 'transparent',
                  color: role === r ? 'hsl(var(--void))' : 'hsl(var(--t2))',
                }}
              >
                {r}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-t2 font-body mb-1 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-elevated border border-border text-t1 font-body text-sm focus:outline-none focus:border-cyan"
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="relative">
              <label className="text-xs text-t2 font-body mb-1 block">Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-elevated border border-border text-t1 font-body text-sm focus:outline-none focus:border-cyan pr-12"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-8 text-t3 hover:text-t2"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && <p className="text-sm font-body" style={{ color: 'var(--red-raw)' }}>{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-display font-bold text-lg transition-all disabled:opacity-50"
              style={{ backgroundColor: 'var(--cyan-raw)', color: 'hsl(var(--void))' }}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Sign In'}
            </button>
          </form>

          <div className="flex justify-between mt-6 text-xs text-t2 font-body">
            <Link to={`/register?role=${role}`} className="hover:text-cyan transition-colors">
              Create account
            </Link>
            <button className="hover:text-cyan transition-colors">
              Forgot password?
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Heart, Stethoscope, ArrowLeft, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Register() {
  const { register } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [role, setRole] = useState<'patient' | 'doctor'>((searchParams.get('role') as 'patient' | 'doctor') || 'patient');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1 fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2 patient
  const [bloodType, setBloodType] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  // Step 2 doctor
  const [specialization, setSpecialization] = useState('');
  const [licenseNo, setLicenseNo] = useState('');
  const [hospital, setHospital] = useState('');

  const validateStep1 = () => {
    if (!fullName || !email || !password) return 'All fields required';
    if (password !== confirmPassword) return 'Passwords do not match';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return null;
  };

  const handleNext = () => {
    const err = validateStep1();
    if (err) { setError(err); return; }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const extras = role === 'patient'
        ? { blood_type: bloodType || null, emergency_contact: emergencyContact || null }
        : { specialization: specialization || null, license_no: licenseNo || null, hospital: hospital || null };
      await register(email, password, role, fullName, extras);
      toast({ title: 'Account created!', description: 'Welcome to ChainPulse.' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-grid flex">
      {/* Left hero */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 blur-[80px]" style={{ background: 'radial-gradient(circle, var(--cyan-raw), transparent)' }} />
        <div className="text-center">
          <h2 className="font-display text-4xl font-extrabold" style={{ color: 'var(--cyan-raw)' }}>ChainPulse</h2>
          <p className="text-t2 text-sm mt-2 font-body">Join the health monitoring revolution.</p>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div className="w-full max-w-md" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="font-display text-3xl font-bold text-t1 mb-2">Create Account</h1>

          {/* Progress bar */}
          <div className="flex gap-2 mb-6">
            <div className="flex-1 h-1 rounded-full" style={{ backgroundColor: 'var(--cyan-raw)' }} />
            <div className="flex-1 h-1 rounded-full" style={{ backgroundColor: step >= 2 ? 'var(--cyan-raw)' : 'hsl(var(--border))' }} />
          </div>

          {/* Role selection */}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-3 mb-6">
              {([
                { r: 'patient' as const, icon: Heart, label: 'Patient' },
                { r: 'doctor' as const, icon: Stethoscope, label: 'Doctor' },
              ]).map(({ r, icon: Icon, label }) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className="p-4 rounded-xl border-2 transition-all text-center"
                  style={{
                    borderColor: role === r ? 'var(--cyan-raw)' : 'hsl(var(--border))',
                    backgroundColor: role === r ? 'var(--cyan-glow)' : 'transparent',
                  }}
                >
                  <Icon className="w-6 h-6 mx-auto mb-2" style={{ color: role === r ? 'var(--cyan-raw)' : 'hsl(var(--t3))' }} />
                  <span className="text-sm font-display font-bold" style={{ color: role === r ? 'var(--cyan-raw)' : 'hsl(var(--t2))' }}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  className="space-y-4"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                >
                  <Input label="Full Name" value={fullName} onChange={setFullName} placeholder="John Doe" />
                  <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
                  <Input label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
                  <Input label="Confirm Password" type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="••••••••" />

                  {error && <p className="text-sm" style={{ color: 'var(--red-raw)' }}>{error}</p>}

                  <button
                    type="button"
                    onClick={handleNext}
                    className="w-full py-3 rounded-xl font-display font-bold text-lg flex items-center justify-center gap-2"
                    style={{ backgroundColor: 'var(--cyan-raw)', color: 'hsl(var(--void))' }}
                  >
                    Next <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  className="space-y-4"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 20, opacity: 0 }}
                >
                  {role === 'patient' ? (
                    <>
                      <div>
                        <label className="text-xs text-t2 font-body mb-1 block">Blood Type</label>
                        <select
                          value={bloodType}
                          onChange={e => setBloodType(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-elevated border border-border text-t1 font-body text-sm focus:outline-none focus:border-cyan"
                        >
                          <option value="">Select</option>
                          {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <Input label="Emergency Contact" value={emergencyContact} onChange={setEmergencyContact} placeholder="+1 234 567 8900" />
                    </>
                  ) : (
                    <>
                      <Input label="Specialization" value={specialization} onChange={setSpecialization} placeholder="Cardiology" />
                      <Input label="License Number" value={licenseNo} onChange={setLicenseNo} placeholder="MD-12345" />
                      <Input label="Hospital" value={hospital} onChange={setHospital} placeholder="General Hospital" />
                    </>
                  )}

                  {error && <p className="text-sm" style={{ color: 'var(--red-raw)' }}>{error}</p>}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 py-3 rounded-xl border font-display font-bold text-sm flex items-center justify-center gap-2 text-t1"
                      style={{ borderColor: 'hsl(var(--border))' }}
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-3 rounded-xl font-display font-bold text-lg disabled:opacity-50"
                      style={{ backgroundColor: 'var(--cyan-raw)', color: 'hsl(var(--void))' }}
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Register'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          <p className="text-xs text-t2 text-center mt-6 font-body">
            Already have an account?{' '}
            <Link to="/login" className="text-cyan hover:underline">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string;
}) {
  return (
    <div>
      <label className="text-xs text-t2 font-body mb-1 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl bg-elevated border border-border text-t1 font-body text-sm focus:outline-none focus:border-cyan"
        placeholder={placeholder}
        required
      />
    </div>
  );
}

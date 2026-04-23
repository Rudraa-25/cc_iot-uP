import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { HeartPulse, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

export const LoginPage: React.FC = () => {
    const [role, setRole] = useState<'patient' | 'doctor'>('patient');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { login, userRole } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        try {
            await login(email, password);
            // AuthContext will update and we can redirect based on role
            // But since state update might be slightly delayed, we can use a small delay or check current role
        } catch (err: any) {
            setError(err.message || 'Failed to login');
            setIsSubmitting(false);
        }
    };

    // Redirect based on role when user object updates
    React.useEffect(() => {
        if (userRole) {
            navigate(userRole === 'patient' ? '/patient/dashboard' : '/doctor/dashboard');
        }
    }, [userRole, navigate]);

    return (
        <div className="min-h-screen bg-bg-primary flex">
            {/* Left Side: Animation & Branding */}
            <div className="hidden lg:flex flex-1 relative items-center justify-center p-12 bg-gradient-to-br from-bg-primary to-[#050810] border-r border-border overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <svg width="100%" height="100%" viewBox="0 0 800 600" preserveAspectRatio="none">
                        <polyline
                            points="0,300 100,300 120,250 150,350 180,300 300,300 320,200 350,400 380,300 500,300 520,280 540,320 560,300 800,300"
                            fill="none" stroke="#00D4FF" strokeWidth="3"
                        >
                            <animate attributeName="points" dur="2s" repeatCount="indefinite"
                                values="0,300 100,300 120,250 150,350 180,300 300,300 320,200 350,400 380,300 500,300 520,280 540,320 560,300 800,300;
                        0,300 100,300 120,280 150,320 180,300 300,300 320,250 350,350 380,300 500,300 520,290 540,310 560,300 800,300;
                        0,300 100,300 120,250 150,350 180,300 300,300 320,200 350,400 380,300 500,300 520,280 540,320 560,300 800,300" />
                        </polyline>
                    </svg>
                </div>

                <div className="relative z-10 text-center">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex items-center justify-center gap-3 mb-8"
                    >
                        <div className="bg-accent-cyan/10 p-4 rounded-3xl border border-accent-cyan/20">
                            <HeartPulse className="w-16 h-16 text-accent-cyan" />
                        </div>
                    </motion.div>
                    <h1 className="text-6xl font-black tracking-tighter mb-4">ChainPulse</h1>
                    <p className="text-xl text-text-secondary font-medium italic">"Real-time health, real peace of mind"</p>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
                <div className="w-full max-w-md">
                    <div className="text-center lg:text-left mb-10">
                        <h2 className="text-3xl font-black mb-2">Welcome Back</h2>
                        <p className="text-text-secondary font-medium">Access your personalized monitoring dashboard</p>
                    </div>

                    {/* Role Toggle */}
                    <div className="bg-bg-secondary p-1 rounded-2xl flex mb-8 border border-border">
                        <button
                            onClick={() => setRole('patient')}
                            className={clsx(
                                "flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all",
                                role === 'patient' ? "bg-bg-card text-accent-cyan shadow-lg" : "text-text-secondary hover:text-white"
                            )}
                        >
                            PATIENT
                        </button>
                        <button
                            onClick={() => setRole('doctor')}
                            className={clsx(
                                "flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all",
                                role === 'doctor' ? "bg-bg-card text-accent-cyan shadow-lg" : "text-text-secondary hover:text-white"
                            )}
                        >
                            DOCTOR
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-text-secondary ml-1">Email Address</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                className="input-field w-full h-14"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-xs font-black uppercase tracking-widest text-text-secondary">Password</label>
                                <button type="button" className="text-[10px] text-accent-cyan font-bold hover:underline">Forgot Password?</button>
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="input-field w-full h-14 pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-white"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-accent-red/10 border border-accent-red/20 rounded-xl text-accent-red text-sm font-bold">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn-primary w-full h-14 text-lg font-black flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "SIGN IN"}
                        </button>
                    </form>

                    <p className="text-center mt-10 text-text-secondary font-medium">
                        Don't have an account? <Link to="/register" className="text-accent-cyan font-bold hover:underline">Create Account</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

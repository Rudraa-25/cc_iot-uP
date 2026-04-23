import React from 'react';
import { Link } from 'react-router-dom';
import { HeartPulse, Activity, ShieldCheck, Users, Zap, ArrowRight, Smartphone, Database, Wifi } from 'lucide-react';
import { motion } from 'framer-motion';

export const LandingPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-bg-primary overflow-x-hidden">
            {/* Navbar Minimal */}
            <nav className="h-20 px-6 sm:px-12 flex items-center justify-between absolute top-0 w-full z-50">
                <Link to="/" className="flex items-center gap-2">
                    <HeartPulse className="w-8 h-8 text-accent-cyan" />
                    <span className="text-2xl font-black tracking-tighter">ChainPulse</span>
                </Link>
                <div className="flex gap-4">
                    <Link to="/login" className="text-sm font-bold hover:text-accent-cyan transition-colors">Login</Link>
                    <Link to="/register" className="btn-primary py-1.5 px-5 text-sm">Join Now</Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-6 sm:px-12 min-h-screen flex flex-col items-center justify-center text-center">
                {/* Animated ECG Background */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-20">
                    <svg className="w-full h-full" viewBox="0 0 1000 1000">
                        <path
                            d="M0 500 L200 500 L220 450 L250 550 L280 500 L400 500 L420 400 L450 600 L480 500 L600 500 L620 480 L640 520 L660 500 L1000 500"
                            fill="none"
                            stroke="#00D4FF"
                            strokeWidth="2"
                            className="animate-[dash_10s_linear_infinite]"
                            style={{ strokeDasharray: 1000, strokeDashoffset: 1000 }}
                        />
                    </svg>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="relative z-10 max-w-4xl"
                >
                    <span className="bg-accent-cyan/10 text-accent-cyan text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full border border-accent-cyan/20">
                        Next-Gen Healthcare IoT
                    </span>
                    <h1 className="text-6xl sm:text-8xl font-black mt-6 leading-tight tracking-tighter">
                        Monitor Health in <br />
                        <span className="text-accent-cyan">Real-Time.</span>
                    </h1>
                    <p className="text-text-secondary text-lg sm:text-xl mt-8 max-w-2xl mx-auto font-medium">
                        Advanced patient monitoring system combining ESP32 IoT technology with Firebase
                        cloud infrastructure for instant vitals and fall detection.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 mt-12 justify-center">
                        <Link to="/register" className="btn-primary py-4 px-10 text-lg flex items-center justify-center gap-2 group">
                            Get Started for Free <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link to="/login" className="btn-secondary py-4 px-10 text-lg">
                            Doctor Portal
                        </Link>
                    </div>
                </motion.div>

                {/* Floating Device UI Mockup */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="mt-20 relative z-10 max-w-5xl w-full"
                >
                    <div className="card p-4 bg-bg-secondary/50 backdrop-blur-xl border-accent-cyan/20 shadow-2xl relative">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                            {[
                                { label: 'Heart Rate', val: '78', unit: 'BPM', color: 'accent-red' },
                                { label: 'SpO2', val: '98', unit: '%', color: 'accent-cyan' },
                                { label: 'Temp', val: '36.5', unit: '°C', color: 'accent-orange' },
                                { label: 'Battery', val: '92', unit: '%', color: 'accent-green' }
                            ].map((item, idx) => (
                                <div key={idx} className="bg-bg-card p-4 rounded-xl border border-border flex flex-col items-center">
                                    <span className="text-[10px] uppercase font-bold text-text-secondary">{item.label}</span>
                                    <span className={`text-2xl font-bold text-${item.color}`}>{item.val}<span className="text-xs ml-1">{item.unit}</span></span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Features */}
            <section className="py-24 px-6 sm:px-12 bg-bg-secondary/50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black">Powerful Features</h2>
                        <p className="text-text-secondary mt-4">Everything you need for critical care remote monitoring.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { icon: Activity, title: 'Real-time Vitals', desc: 'Instant streaming of HR, SpO2, and Temperature via RTDB.' },
                            { icon: ShieldCheck, title: 'Fall Detection', desc: 'AI-powered accelerometer analysis with instant g-force alerts.' },
                            { icon: Users, title: 'Multi-patient', desc: 'Unified dashboard for doctors to monitor entire wards.' },
                            { icon: Zap, title: 'Instant Alerts', desc: 'Global notifications across all connected doctor devices.' }
                        ].map((f, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -10 }}
                                className="card p-8 group"
                            >
                                <div className="bg-bg-secondary p-4 rounded-2xl mb-6 group-hover:bg-accent-cyan transition-colors">
                                    <f.icon className="w-8 h-8 text-accent-cyan group-hover:text-bg-primary" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                                <p className="text-text-secondary text-sm leading-relaxed">{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it Works */}
            <section className="py-24 px-6 sm:px-12">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl font-black mb-16">How it Works</h2>
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-12">
                        <div className="flex flex-col items-center flex-1">
                            <div className="w-20 h-20 bg-accent-cyan/10 rounded-full flex items-center justify-center mb-6">
                                <Smartphone className="w-10 h-10 text-accent-cyan" />
                            </div>
                            <h4 className="font-bold text-xl mb-2">IoT Device</h4>
                            <p className="text-sm text-text-secondary">ESP32-C3 Mini collects data from medical sensors.</p>
                        </div>
                        <ArrowRight className="w-10 h-10 text-border hidden sm:block" />
                        <div className="flex flex-col items-center flex-1">
                            <div className="w-20 h-20 bg-accent-green/10 rounded-full flex items-center justify-center mb-6">
                                <Database className="w-10 h-10 text-accent-green" />
                            </div>
                            <h4 className="font-bold text-xl mb-2">Firebase Cloud</h4>
                            <p className="text-sm text-text-secondary">Secure processing and instant data distribution.</p>
                        </div>
                        <ArrowRight className="w-10 h-10 text-border hidden sm:block" />
                        <div className="flex flex-col items-center flex-1">
                            <div className="w-20 h-20 bg-accent-red/10 rounded-full flex items-center justify-center mb-6">
                                <Wifi className="w-10 h-10 text-accent-red" />
                            </div>
                            <h4 className="font-bold text-xl mb-2">ChainPulse UI</h4>
                            <p className="text-sm text-text-secondary">Intuitive dashboards for patients and doctors.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 sm:px-12 border-t border-border text-center">
                <p className="text-text-secondary text-sm">© 2024 ChainPulse Health Systems. All rights reserved.</p>
            </footer>
        </div>
    );
};

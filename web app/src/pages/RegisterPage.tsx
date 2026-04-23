import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, Stethoscope, ArrowRight, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

export const RegisterPage: React.FC = () => {
    const [step, setStep] = useState(1);
    const [role, setRole] = useState<'patient' | 'doctor' | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        age: '',
        bloodType: '',
        emergencyContact: '',
        specialization: '',
        licenseNumber: '',
        hospital: ''
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const nextStep = () => {
        if (!role && step === 1) return;
        setStep(step + 1);
    };

    const prevStep = () => setStep(step - 1);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!role) return;

        setError('');
        setIsSubmitting(true);
        try {
            await register({
                ...formData,
                role: role,
                age: parseInt(formData.age) || 0,
            });
            // Redirect handled by AuthContext or manual
            navigate(role === 'patient' ? '/patient/dashboard' : '/doctor/dashboard');
        } catch (err: any) {
            setError(err.message || 'Registration failed');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-2xl">
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-black mb-2">Create Account</h2>
                    <p className="text-text-secondary font-medium">Join the ChainPulse medical ecosystem</p>
                </div>

                {/* Progress Tracker */}
                <div className="flex items-center justify-between mb-12 max-w-xs mx-auto">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center">
                            <div className={clsx(
                                "w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-all",
                                step >= s ? "bg-accent-cyan border-accent-cyan text-bg-primary" : "border-border text-text-secondary"
                            )}>
                                {step > s ? <CheckCircle2 className="w-6 h-6" /> : s}
                            </div>
                            {s < 3 && <div className={clsx("w-12 h-1 border-t-2", step > s ? "border-accent-cyan" : "border-border")} />}
                        </div>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="card p-8 sm:p-12 relative overflow-hidden bg-bg-secondary/30 backdrop-blur-xl">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <h3 className="text-2xl font-bold text-center">First, choose your role</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div
                                        onClick={() => setRole('patient')}
                                        className={clsx(
                                            "p-8 rounded-3xl border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-4 hover:bg-bg-card",
                                            role === 'patient' ? "border-accent-cyan bg-bg-card shadow-[0_0_30px_rgba(0,212,255,0.1)]" : "border-border text-text-secondary"
                                        )}
                                    >
                                        <div className={clsx("p-4 rounded-2xl", role === 'patient' ? "bg-accent-cyan text-bg-primary" : "bg-bg-card")}>
                                            <Heart className="w-10 h-10" />
                                        </div>
                                        <div>
                                            <h4 className={clsx("text-xl font-bold", role === 'patient' ? "text-white" : "")}>I'm a Patient</h4>
                                            <p className="text-sm mt-1">Monitor your vitals and get emergency help.</p>
                                        </div>
                                    </div>

                                    <div
                                        onClick={() => setRole('doctor')}
                                        className={clsx(
                                            "p-8 rounded-3xl border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-4 hover:bg-bg-card",
                                            role === 'doctor' ? "border-accent-cyan bg-bg-card shadow-[0_0_30px_rgba(0,212,255,0.1)]" : "border-border text-text-secondary"
                                        )}
                                    >
                                        <div className={clsx("p-4 rounded-2xl", role === 'doctor' ? "bg-accent-cyan text-bg-primary" : "bg-bg-card")}>
                                            <Stethoscope className="w-10 h-10" />
                                        </div>
                                        <div>
                                            <h4 className={clsx("text-xl font-bold", role === 'doctor' ? "text-white" : "")}>I'm a Doctor</h4>
                                            <p className="text-sm mt-1">Manage patients and receive clinical alerts.</p>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    disabled={!role}
                                    onClick={nextStep}
                                    className="btn-primary w-full h-14 font-black flex items-center justify-center gap-2 mt-8 disabled:opacity-50"
                                >
                                    NEXT STEP <ArrowRight className="w-5 h-5" />
                                </button>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <h3 className="text-2xl font-bold text-center">Account Information</h3>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-text-secondary ml-1">Full Name</label>
                                        <input name="name" required value={formData.name} onChange={handleInputChange} className="input-field w-full h-12" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-text-secondary ml-1">Email Address</label>
                                        <input type="email" name="email" required value={formData.email} onChange={handleInputChange} className="input-field w-full h-12" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-text-secondary ml-1">Create Password</label>
                                        <input type="password" name="password" required value={formData.password} onChange={handleInputChange} className="input-field w-full h-12" />
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button type="button" onClick={prevStep} className="btn-secondary flex-1 h-14 flex items-center justify-center gap-2">
                                        <ArrowLeft className="w-5 h-5" /> BACK
                                    </button>
                                    <button type="button" onClick={nextStep} className="btn-primary flex-2 h-14 font-black flex items-center justify-center gap-2">
                                        CONTINUE <ArrowRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <h3 className="text-2xl font-bold text-center">Professional Details</h3>
                                <div className="space-y-4">
                                    {role === 'patient' ? (
                                        <>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black uppercase tracking-widest text-text-secondary ml-1">Age</label>
                                                    <input type="number" name="age" required value={formData.age} onChange={handleInputChange} className="input-field w-full h-12" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black uppercase tracking-widest text-text-secondary ml-1">Blood Type</label>
                                                    <select name="bloodType" required value={formData.bloodType} onChange={handleInputChange} className="input-field w-full h-12">
                                                        <option value="">Select</option>
                                                        <option value="A+">A+</option><option value="A-">A-</option>
                                                        <option value="B+">B+</option><option value="B-">B-</option>
                                                        <option value="O+">O+</option><option value="O-">O-</option>
                                                        <option value="AB+">AB+</option><option value="AB-">AB-</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-black uppercase tracking-widest text-text-secondary ml-1">Emergency Contact Number</label>
                                                <input name="emergencyContact" required value={formData.emergencyContact} onChange={handleInputChange} className="input-field w-full h-12" />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="space-y-2">
                                                <label className="text-xs font-black uppercase tracking-widest text-text-secondary ml-1">Medical Specialization</label>
                                                <input name="specialization" required value={formData.specialization} onChange={handleInputChange} className="input-field w-full h-12" placeholder="e.g. Cardiologist" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black uppercase tracking-widest text-text-secondary ml-1">License Number</label>
                                                    <input name="licenseNumber" required value={formData.licenseNumber} onChange={handleInputChange} className="input-field w-full h-12" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black uppercase tracking-widest text-text-secondary ml-1">Primary Hospital</label>
                                                    <input name="hospital" required value={formData.hospital} onChange={handleInputChange} className="input-field w-full h-12" />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {error && (
                                    <div className="p-4 bg-accent-red/10 border border-accent-red/20 rounded-xl text-accent-red text-sm font-bold animate-shake">
                                        {error}
                                    </div>
                                )}

                                <div className="flex gap-4 pt-4">
                                    <button type="button" onClick={prevStep} className="btn-secondary flex-1 h-14 flex items-center justify-center gap-2">
                                        <ArrowLeft className="w-5 h-5" /> BACK
                                    </button>
                                    <button type="submit" disabled={isSubmitting} className="btn-primary flex-2 h-14 font-black flex items-center justify-center gap-2">
                                        {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "COMPLETE REGISTRATION"}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </form>

                <p className="text-center mt-8 text-text-secondary font-medium">
                    Already have an account? <Link to="/login" className="text-accent-cyan font-bold hover:underline">Sign In Instead</Link>
                </p>
            </div>
        </div>
    );
};

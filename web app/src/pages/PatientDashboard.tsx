import React from 'react';
import { Navbar } from '../components/Navbar';
import { VitalCard } from '../components/VitalCard';
import { VitalChart } from '../components/VitalChart';
import { FallAlert } from '../components/FallAlert';
import { useAuth } from '../contexts/AuthContext';
import { useVitals } from '../hooks/useVitals';
import { useFallAlert } from '../hooks/useFallAlert';
import { Heart, Droplets, Thermometer, Wind, Wifi, WifiOff, Clock, User as UserIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import type { PatientProfile } from '../types';

export const PatientDashboard: React.FC = () => {
    const { userProfile } = useAuth();
    const { vitals, history, isOnline } = useVitals(userProfile?.uid || null);
    const { fallStatus, resolveFall } = useFallAlert(userProfile?.uid || null, userProfile?.name || 'Patient');
    const [secondsAgo, setSecondsAgo] = React.useState(0);

    React.useEffect(() => {
        const interval = setInterval(() => {
            if (vitals?.timestamp) {
                setSecondsAgo(Math.floor((Date.now() - vitals.timestamp) / 1000));
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [vitals]);

    const profile = userProfile as PatientProfile;

    if (!userProfile || userProfile.role !== 'patient') return null;

    const getHRStatus = (hr: number) => {
        if (hr < 50 || hr > 120) return { status: 'Critical' as const, color: 'bg-accent-red text-white' };
        if (hr >= 100) return { status: 'Elevated' as const, color: 'bg-accent-yellow text-bg-primary' };
        return { status: 'Normal' as const, color: 'bg-accent-green text-bg-primary' };
    };

    const getSpO2Status = (spo2: number) => {
        if (spo2 < 90) return { status: 'Low O2' as const, color: 'bg-accent-red text-white' };
        if (spo2 < 95) return { status: 'Warning' as const, color: 'bg-accent-yellow text-bg-primary' };
        return { status: 'Normal' as const, color: 'bg-accent-green text-bg-primary' };
    };

    const getTempStatus = (temp: number) => {
        if (temp > 38.5) return { status: 'Fever' as const, color: 'bg-accent-red text-white' };
        if (temp > 37.5) return { status: 'Warning' as const, color: 'bg-accent-yellow text-bg-primary' };
        return { status: 'Normal' as const, color: 'bg-accent-green text-bg-primary' };
    };

    const getHumidityStatus = (hum: number) => {
        if (hum < 40 || hum > 60) return { status: 'Warning' as const, color: 'bg-accent-yellow text-bg-primary' };
        return { status: 'Normal' as const, color: 'bg-accent-green text-bg-primary' };
    };

    return (
        <div className="min-h-screen bg-bg-primary">
            <Navbar />

            {/* Offline Banner */}
            {!isOnline && (
                <div className="bg-accent-red/20 border-b border-accent-red/50 py-2 px-6 flex items-center justify-center gap-2 animate-pulse">
                    <WifiOff className="w-4 h-4 text-accent-red" />
                    <span className="text-xs font-bold text-accent-red uppercase tracking-widest">Device Offline — Last synced {vitals ? format(vitals.timestamp || 0, 'HH:mm') : 'long ago'}</span>
                </div>
            )}

            {/* Fall Alert Banner Persistent */}
            {fallStatus?.detected && (
                <div className="bg-accent-red py-3 px-6 flex items-center justify-between text-white font-bold animate-pulse">
                    <div className="flex items-center gap-3">
                        <WifiOff className="w-5 h-5 animate-bounce" />
                        <span>⚠️ EMERGENCY: FALL DETECTED</span>
                    </div>
                    <button onClick={resolveFall} className="bg-white text-accent-red px-4 py-1 rounded-lg text-sm">RESOLVE</button>
                </div>
            )}

            <main className="max-w-7xl mx-auto p-6 sm:p-12">
                <header className="mb-12 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                    <div>
                        <h1 className="text-4xl font-black mb-2">Patient Dashboard</h1>
                        <div className="flex items-center gap-2 text-text-secondary font-medium">
                            <Clock className="w-4 h-4 text-accent-cyan" />
                            <span>Last updated: <span className="text-white font-bold">{secondsAgo}s ago</span></span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 bg-bg-secondary p-4 rounded-2xl border border-border">
                        <div className={clsx("w-3 h-3 rounded-full", isOnline ? "bg-accent-green shadow-[0_0_10px_#00D68F]" : "bg-text-secondary")}></div>
                        <span className="text-sm font-bold">{isOnline ? 'DEVICE ONLINE' : 'DEVICE OFFLINE'}</span>
                    </div>
                </header>

                {/* Vital Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    <VitalCard
                        title="Heart Rate"
                        value={vitals?.heart_rate || '--'}
                        unit="BPM"
                        icon={Heart}
                        color="red"
                        status={getHRStatus(vitals?.heart_rate || 0).status as any}
                        statusColor={getHRStatus(vitals?.heart_rate || 0).color}
                        animateIcon
                    />
                    <VitalCard
                        title="Oxygen Saturation (SpO2)"
                        value={vitals?.spo2 || '--'}
                        unit="%"
                        icon={Droplets}
                        color="blue"
                        status={getSpO2Status(vitals?.spo2 || 100).status as any}
                        statusColor={getSpO2Status(vitals?.spo2 || 100).color}
                    />
                    <VitalCard
                        title="Body Temp"
                        value={vitals?.temperature || '--'}
                        unit="°C"
                        icon={Thermometer}
                        color="orange"
                        status={getTempStatus(vitals?.temperature || 36.5).status as any}
                        statusColor={getTempStatus(vitals?.temperature || 36.5).color}
                    />
                    <VitalCard
                        title="Ambient Humidity"
                        value={vitals?.humidity || '--'}
                        unit="%"
                        icon={Wind}
                        color="teal"
                        status={getHumidityStatus(vitals?.humidity || 50).status as any}
                        statusColor={getHumidityStatus(vitals?.humidity || 50).color}
                    />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
                    <VitalChart
                        title="Heart Rate History"
                        data={history}
                        dataKey="heart_rate"
                        color="#FF4757"
                        unit="BPM"
                    />
                    <VitalChart
                        title="Oxygen History"
                        data={history}
                        dataKey="spo2"
                        color="#00D4FF"
                        unit="%"
                    />
                    <VitalChart
                        title="Temperature History"
                        data={history}
                        dataKey="temperature"
                        color="#FF6B35"
                        unit="°C"
                    />
                </div>

                {/* Health Summary & Profile */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="card p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <Clock className="w-6 h-6 text-accent-cyan" />
                            <h3 className="text-2xl font-bold">Health Summary</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between p-4 bg-bg-secondary rounded-xl">
                                <span className="text-text-secondary">Last Sync</span>
                                <span className="font-bold">{vitals ? format(vitals.timestamp || 0, 'HH:mm:ss') : '--'}</span>
                            </div>
                            <div className="flex justify-between p-4 bg-bg-secondary rounded-xl font-bold">
                                <span className="text-text-secondary">Assigned Doctor</span>
                                <span className="text-accent-cyan">Dr. Not Assigned</span>
                            </div>
                            <div className="flex justify-between p-4 bg-bg-secondary rounded-xl">
                                <span className="text-text-secondary">Emergency Contact</span>
                                <span className="font-bold">{profile.emergencyContact}</span>
                            </div>
                        </div>
                    </div>

                    <div className="card p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <UserIcon className="w-6 h-6 text-accent-cyan" />
                            <h3 className="text-2xl font-bold">Patient Profile</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <p className="text-xs text-text-secondary uppercase font-black">Full Name</p>
                                <p className="text-lg font-bold">{userProfile.name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-text-secondary uppercase font-black">Age</p>
                                <p className="text-lg font-bold">{profile.age} Years</p>
                            </div>
                            <div>
                                <p className="text-xs text-text-secondary uppercase font-black">Blood Type</p>
                                <p className="text-lg font-bold text-accent-red">{profile.bloodType}</p>
                            </div>
                            <div>
                                <p className="text-xs text-text-secondary uppercase font-black">Account Role</p>
                                <p className="text-lg font-bold capitalize">{userProfile.role}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <FallAlert
                isVisible={!!fallStatus?.detected}
                gForce={fallStatus?.g_force || 0}
                timestamp={fallStatus?.last_updated}
                onResolve={resolveFall}
            />
        </div>
    );
};

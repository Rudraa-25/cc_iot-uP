import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { VitalCard } from '../components/VitalCard';
import { VitalChart } from '../components/VitalChart';
import { useVitals } from '../hooks/useVitals';
import {
    Heart,
    Droplets,
    Thermometer,
    Wind,
    ArrowLeft,
    Calendar,
    Phone,
    Droplet,
    ClipboardList,
    Activity
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { PatientProfile } from '../types';

export const PatientDetail: React.FC = () => {
    const { patientId } = useParams<{ patientId: string }>();
    const [patient, setPatient] = React.useState<PatientProfile | null>(null);
    const { vitals, history, isOnline } = useVitals(patientId || null);

    React.useEffect(() => {
        const fetchPatient = async () => {
            if (!patientId) return;
            const docRef = doc(db, 'patients', patientId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setPatient(docSnap.data() as PatientProfile);
            }
        };
        fetchPatient();
    }, [patientId]);

    if (!patient) {
        return (
            <div className="min-h-screen bg-bg-primary flex items-center justify-center">
                <div className="animate-spin w-12 h-12 border-4 border-accent-cyan border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg-primary">
            <Navbar />

            <main className="max-w-7xl mx-auto p-6 sm:p-12">
                <Link to="/doctor/dashboard" className="flex items-center gap-2 text-text-secondary hover:text-accent-cyan mb-8 transition-colors group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Ward Overview
                </Link>

                <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-bg-secondary border-2 border-accent-cyan rounded-3xl flex items-center justify-center text-3xl font-black italic">
                            {patient.name.charAt(0)}
                        </div>
                        <div>
                            <h1 className="text-4xl font-black mb-1">{patient.name}</h1>
                            <div className="flex flex-wrap gap-4 text-sm font-medium text-text-secondary">
                                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {patient.age} Years</span>
                                <span className="flex items-center gap-1 text-accent-red"><Droplet className="w-4 h-4" /> Type {patient.bloodType}</span>
                                <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {patient.emergencyContact}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button className="btn-secondary h-12 px-6">CONTACT FAMILY</button>
                        <button className="btn-primary h-12 px-6">ADD CLINICAL NOTE</button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <VitalCard
                                title="Heart Rate"
                                value={vitals?.heart_rate || '--'}
                                unit="BPM"
                                icon={Heart}
                                color="red"
                                status="Normal"
                                statusColor="bg-accent-green/10 text-accent-green"
                                animateIcon
                            />
                            <VitalCard
                                title="Oxygen (SpO2)"
                                value={vitals?.spo2 || '--'}
                                unit="%"
                                icon={Droplets}
                                color="blue"
                                status="Normal"
                                statusColor="bg-accent-green/10 text-accent-green"
                            />
                            <VitalCard
                                title="Temp"
                                value={vitals?.temperature || '--'}
                                unit="°C"
                                icon={Thermometer}
                                color="orange"
                                status="Normal"
                                statusColor="bg-accent-green/10 text-accent-green"
                            />
                            <VitalCard
                                title="Humidity"
                                value={vitals?.humidity || '--'}
                                unit="%"
                                icon={Wind}
                                color="teal"
                                status="Normal"
                                statusColor="bg-accent-green/10 text-accent-green"
                            />
                        </div>

                        <div className="space-y-6">
                            <VitalChart
                                title="Real-time Heart Rate Stream"
                                data={history}
                                dataKey="heart_rate"
                                color="#FF4757"
                                unit="BPM"
                            />
                            <VitalChart
                                title="Oxygen Levels"
                                data={history}
                                dataKey="spo2"
                                color="#00D4FF"
                                unit="%"
                            />
                        </div>
                    </div>

                    {/* Sidebar Info */}
                    <div className="space-y-8">
                        <div className="card p-6">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <ClipboardList className="w-5 h-5 text-accent-cyan" /> Clinical Notes
                            </h3>
                            <div className="space-y-4">
                                <div className="p-4 bg-bg-secondary rounded-xl">
                                    <p className="text-xs text-text-secondary mb-1">Yesterday, 14:20 • Dr. Self</p>
                                    <p className="text-sm font-medium">Patient stable. Vitals within normal range for age group.</p>
                                </div>
                                <div className="p-4 bg-bg-secondary rounded-xl border-l-4 border-accent-yellow">
                                    <p className="text-xs text-text-secondary mb-1">02 Mar, 09:15 • Dr. Sarah</p>
                                    <p className="text-sm font-medium">Mild tachycardia observed during sleep. Adjusted monitoring sensitivity.</p>
                                </div>
                                <button className="w-full text-center text-xs font-bold text-accent-cyan hover:underline uppercase tracking-widest pt-2">View All Notes</button>
                            </div>
                        </div>

                        <div className="card p-6">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-accent-cyan" /> Device Status
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-text-secondary">Connection</span>
                                    <span className={isOnline ? "text-accent-green font-bold" : "text-accent-red font-bold"}>
                                        {isOnline ? 'Online' : 'Offline'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-text-secondary">Battery</span>
                                    <span className="font-bold">88%</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-text-secondary">Last Updated</span>
                                    <span className="font-bold">
                                        {vitals ? new Date(vitals.timestamp || 0).toLocaleTimeString() : 'Never'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

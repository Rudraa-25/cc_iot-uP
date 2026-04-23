import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { PatientCard } from '../components/PatientCard';
import { useAuth } from '../contexts/AuthContext';
import { usePatients } from '../hooks/usePatients';
import {
    Users,
    AlertTriangle,
    Activity,
    Search,
    Filter,
    LayoutDashboard,
    ShieldAlert,
    Settings,
    UserCheck
} from 'lucide-react';
import { clsx } from 'clsx';

export const DoctorDashboard: React.FC = () => {
    const { userProfile } = useAuth();
    const { patients, patientVitals, loading } = usePatients();
    const [searchTerm, setSearchTerm] = useState('');

    if (!userProfile) return null;

    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeAlertsCount = 0; // In a real app, count from collection
    const onlineCount = Object.keys(patientVitals).length;
    const criticalCount = Object.values(patientVitals).filter(v =>
        v.heart_rate > 100 || v.spo2 < 90 || v.temperature > 38.5
    ).length;

    return (
        <div className="min-h-screen bg-bg-primary flex flex-col sm:flex-row">
            {/* Sidebar - Desktop Only */}
            <aside className="w-64 border-r border-border bg-bg-secondary/30 hidden lg:flex flex-col p-6 sticky top-0 h-screen">
                <div className="flex items-center gap-2 mb-12">
                    <Activity className="w-8 h-8 text-accent-cyan" />
                    <span className="text-xl font-black italic">CLINICAL</span>
                </div>

                <nav className="space-y-4 flex-1">
                    <button className="w-full flex items-center gap-3 px-4 py-3 bg-accent-cyan/10 text-accent-cyan rounded-xl font-bold">
                        <LayoutDashboard className="w-5 h-5" /> Dashboard
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-text-secondary hover:text-white transition-colors">
                        <Users className="w-5 h-5" /> My Patients
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-text-secondary hover:text-white transition-colors">
                        <ShieldAlert className="w-5 h-5" /> Alerts Panel
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-text-secondary hover:text-white transition-colors">
                        <Settings className="w-5 h-5" /> Settings
                    </button>
                </nav>

                <div className="mt-auto p-4 bg-bg-card border border-border rounded-2xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-2">Hospital Info</p>
                    <p className="text-sm font-bold truncate">{(userProfile as any).hospital}</p>
                </div>
            </aside>

            <div className="flex-1 flex flex-col">
                <Navbar />

                <main className="p-6 sm:p-12 max-w-7xl mx-auto w-full">
                    <header className="mb-12">
                        <div className="flex justify-between items-end mb-8">
                            <div>
                                <h1 className="text-4xl font-black mb-2">Clinical Portal</h1>
                                <p className="text-text-secondary font-medium">Monitoring {patients.length} active subjects across your wards.</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                                    <input
                                        type="text"
                                        placeholder="Search patient..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="bg-bg-secondary border border-border rounded-xl pl-12 pr-6 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-accent-cyan/50"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Stats Bar */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { label: 'Total Patients', val: patients.length, icon: Users, color: 'text-white' },
                                { label: 'Active Alerts', val: activeAlertsCount, icon: AlertTriangle, color: 'text-accent-red' },
                                { label: 'Online Devices', val: onlineCount, icon: Wifi, color: 'text-accent-green' },
                                { label: 'Critical Cases', val: criticalCount, icon: UserCheck, color: 'text-accent-yellow' }
                            ].map((stat, i) => (
                                <div key={i} className="card p-6 flex flex-col justify-between h-32">
                                    <div className="flex justify-between items-start">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{stat.label}</span>
                                        <stat.icon className={clsx("w-5 h-5", stat.color)} />
                                    </div>
                                    <span className="text-3xl font-bold font-mono">{stat.val}</span>
                                </div>
                            ))}
                        </div>
                    </header>

                    <section>
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-2xl font-bold">Patients Overview</h3>
                            <button className="flex items-center gap-2 text-sm font-bold text-accent-cyan hover:underline">
                                <Filter className="w-4 h-4" /> Filter Views
                            </button>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1, 2, 3].map(i => <div key={i} className="card h-48 animate-pulse" />)}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredPatients.map(patient => (
                                    <PatientCard
                                        key={patient.uid}
                                        patient={patient}
                                        vitals={patientVitals[patient.uid]}
                                        isAlertActive={false} // Would check against alerts collection
                                    />
                                ))}
                                {filteredPatients.length === 0 && (
                                    <div className="col-span-full py-20 text-center card bg-bg-secondary/20">
                                        <p className="text-text-secondary font-medium">No patients found matching your search.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                </main>
            </div>
        </div>
    );
};

// Simple Wifi icon placeholder as Lucide doesn't have a plain Wifi often used
const Wifi = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 13a10 10 0 0 1 14 0" /><path d="M8.5 16.5a5 5 0 0 1 7 0" /><path d="M2 8.82a15 15 0 0 1 20 0" /><line x1="12" y1="20" x2="12.01" y2="20" />
    </svg>
);

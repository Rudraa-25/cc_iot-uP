import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Droplets, Thermometer, ChevronRight, AlertCircle } from 'lucide-react';
import { PatientProfile, VitalData } from '../types';
import { clsx } from 'clsx';

interface PatientCardProps {
    patient: PatientProfile;
    vitals?: VitalData;
    isAlertActive?: boolean;
}

export const PatientCard: React.FC<PatientCardProps> = ({ patient, vitals, isAlertActive }) => {
    const getStatusColor = () => {
        if (isAlertActive) return 'border-accent-red shadow-[0_0_15px_rgba(255,71,87,0.2)]';
        if (!vitals) return 'border-border';
        if (vitals.heart_rate > 100 || vitals.spo2 < 95) return 'border-accent-yellow';
        return 'border-accent-green';
    };

    return (
        <div className={clsx(
            "card p-5 relative overflow-hidden flex flex-col justify-between border-2",
            getStatusColor()
        )}>
            {isAlertActive && (
                <div className="absolute top-0 right-0 p-2 bg-accent-red rounded-bl-xl animate-pulse">
                    <AlertCircle className="w-4 h-4 text-white" />
                </div>
            )}

            <div className="flex items-start gap-4 mb-4">
                <div className={clsx(
                    "w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold bg-bg-secondary border-2",
                    isAlertActive ? "border-accent-red text-accent-red" : "border-border text-text-secondary"
                )}>
                    {patient.name.charAt(0)}
                </div>
                <div>
                    <h3 className="font-bold text-lg leading-tight">{patient.name}</h3>
                    <p className="text-xs text-text-secondary">
                        {patient.age} Yrs • {patient.bloodType} • ID: {patient.uid.substring(0, 8)}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-bg-secondary/50 p-2 rounded-xl text-center">
                    <Heart className="w-3 h-3 text-accent-red mx-auto mb-1" />
                    <span className="text-sm font-bold block font-mono">
                        {vitals?.heart_rate || '--'}
                    </span>
                    <span className="text-[10px] text-text-secondary uppercase">BPM</span>
                </div>
                <div className="bg-bg-secondary/50 p-2 rounded-xl text-center">
                    <Droplets className="w-3 h-3 text-accent-cyan mx-auto mb-1" />
                    <span className="text-sm font-bold block font-mono">
                        {vitals?.spo2 || '--'}%
                    </span>
                    <span className="text-[10px] text-text-secondary uppercase">O2</span>
                </div>
                <div className="bg-bg-secondary/50 p-2 rounded-xl text-center">
                    <Thermometer className="w-3 h-3 text-accent-orange mx-auto mb-1" />
                    <span className="text-sm font-bold block font-mono">
                        {vitals?.temperature || '--'}°
                    </span>
                    <span className="text-[10px] text-text-secondary uppercase">Temp</span>
                </div>
            </div>

            <Link
                to={`/doctor/patient/${patient.uid}`}
                className="w-full bg-bg-secondary hover:bg-accent-cyan hover:text-bg-primary text-text-primary text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1 transition-all"
            >
                VIEW DETAILS <ChevronRight className="w-3 h-3" />
            </Link>
        </div>
    );
};

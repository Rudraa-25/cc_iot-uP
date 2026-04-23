export type UserRole = 'patient' | 'doctor';

export interface BaseUser {
    uid: string;
    email: string;
    name: string;
    role: UserRole;
    createdAt: any;
}

export interface PatientProfile extends BaseUser {
    age: number;
    bloodType: string;
    emergencyContact: string;
    assignedDoctorId: string | null;
    deviceId: string;
}

export interface DoctorProfile extends BaseUser {
    specialization: string;
    licenseNumber: string;
    hospital: string;
}

export interface VitalData {
    heart_rate: number;
    spo2: number;
    temperature: number;
    humidity: number;
    timestamp?: number;
}

export interface FallStatus {
    detected: boolean;
    g_force: number;
    last_updated: any;
}

export interface Alert {
    id: string;
    patientId: string;
    patientName: string;
    type: 'fall';
    gForce: number;
    timestamp: any;
    resolved: boolean;
    resolvedBy: string | null;
    resolvedAt: any | null;
}

export interface PatientHistoryRecord extends VitalData {
    recordedAt: any;
}

export interface RegisterData {
    role: UserRole;
    email: string;
    password: string;
    name: string;
    // Patient specific
    age?: number;
    bloodType?: string;
    emergencyContact?: string;
    // Doctor specific
    specialization?: string;
    licenseNumber?: string;
    hospital?: string;
}

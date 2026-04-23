import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { UserRole, PatientProfile, DoctorProfile, RegisterData } from '../types';

interface AuthContextType {
    user: FirebaseUser | null;
    userRole: UserRole | null;
    userProfile: PatientProfile | DoctorProfile | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [userRole, setUserRole] = useState<UserRole | null>(null);
    const [userProfile, setUserProfile] = useState<PatientProfile | DoctorProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setLoading(true);
            if (firebaseUser) {
                setUser(firebaseUser);
                // Fetch role and profile from Firestore
                const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                if (userDoc.exists()) {
                    const role = userDoc.data().role as UserRole;
                    setUserRole(role);

                    const profileDoc = await getDoc(doc(db, role === 'patient' ? 'patients' : 'doctors', firebaseUser.uid));
                    if (profileDoc.exists()) {
                        setUserProfile(profileDoc.data() as PatientProfile | DoctorProfile);
                    }
                }
            } else {
                setUser(null);
                setUserRole(null);
                setUserProfile(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const register = async (data: RegisterData) => {
        const { email, password, name, role, ...extra } = data;
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;

        // 1. Create entry in users collection
        await setDoc(doc(db, 'users', uid), {
            uid,
            email,
            name,
            role,
            createdAt: serverTimestamp(),
        });

        // 2. Create entry in specific role collection
        if (role === 'patient') {
            await setDoc(doc(db, 'patients', uid), {
                uid,
                email,
                name,
                role,
                age: extra.age || 0,
                bloodType: extra.bloodType || '',
                emergencyContact: extra.emergencyContact || '',
                assignedDoctorId: null,
                deviceId: `patient_${uid.substring(0, 5)}`,
                createdAt: serverTimestamp(),
            });
        } else {
            await setDoc(doc(db, 'doctors', uid), {
                uid,
                email,
                name,
                role,
                specialization: extra.specialization || '',
                licenseNumber: extra.licenseNumber || '',
                hospital: extra.hospital || '',
                createdAt: serverTimestamp(),
            });
        }
    };

    const logout = async () => {
        await signOut(auth);
    };

    return (
        <AuthContext.Provider value={{ user, userRole, userProfile, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

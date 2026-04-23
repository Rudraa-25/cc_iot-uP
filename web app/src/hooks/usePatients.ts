import { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { ref, onValue } from 'firebase/database';
import { db, rtdb } from '../firebase/config';
import { PatientProfile, VitalData } from '../types';

export const usePatients = () => {
    const [patients, setPatients] = useState<PatientProfile[]>([]);
    const [patientVitals, setPatientVitals] = useState<Record<string, VitalData>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'patients'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const patientList: PatientProfile[] = [];
            snapshot.forEach((doc) => {
                patientList.push({ uid: doc.id, ...doc.data() } as PatientProfile);
            });
            setPatients(patientList);
            setLoading(false);

            // Set up individual RTDB listeners for each patient
            patientList.forEach((patient) => {
                const vitalsRef = ref(rtdb, `patients/${patient.uid}/vitals`);
                onValue(vitalsRef, (vitalSnap) => {
                    const data = vitalSnap.val();
                    if (data) {
                        setPatientVitals((prev) => ({
                            ...prev,
                            [patient.uid]: data
                        }));
                    }
                });
            });
        });

        return () => unsubscribe();
    }, []);

    return { patients, patientVitals, loading };
};

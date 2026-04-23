import { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { rtdb } from '../firebase/config';
import { VitalData } from '../types';

export const useVitals = (patientId: string | null) => {
    const [vitals, setVitals] = useState<VitalData | null>(null);
    const [history, setHistory] = useState<VitalData[]>([]);
    const [isOnline, setIsOnline] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!patientId) {
            setLoading(false);
            return;
        }

        const vitalsRef = ref(rtdb, `patients/${patientId}/vitals`);

        const unsubscribe = onValue(vitalsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setVitals(data);
                setIsOnline(true);

                // Update history (keep last 20)
                setHistory((prev) => {
                    const newPoint = { ...data, timestamp: Date.now() };
                    const newHistory = [...prev, newPoint];
                    return newHistory.slice(-20);
                });
            }
            setLoading(false);
        });

        // Check online status (if no update in 15 seconds)
        const interval = setInterval(() => {
            if (vitals && vitals.timestamp && Date.now() - vitals.timestamp > 15000) {
                setIsOnline(false);
            }
        }, 5000);

        return () => {
            off(vitalsRef);
            clearInterval(interval);
        };
    }, [patientId]);

    return { vitals, history, isOnline, loading };
};

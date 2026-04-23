import { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { rtdb, db } from '../firebase/config';
import { FallStatus } from '../types';

export const useFallAlert = (patientId: string | null, patientName: string) => {
    const [fallStatus, setFallStatus] = useState<FallStatus | null>(null);

    useEffect(() => {
        if (!patientId) return;

        const fallRef = ref(rtdb, `patients/${patientId}/fall_status`);

        const unsubscribe = onValue(fallRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setFallStatus(data);
                if (data.detected) {
                    // Play sound
                    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                    audio.play().catch(e => console.error("Sound play failed", e));
                }
            }
        });

        return () => unsubscribe();
    }, [patientId]);

    const resolveFall = async () => {
        if (!patientId) return;

        // 1. Update RTDB
        await update(ref(rtdb, `patients/${patientId}/fall_status`), {
            detected: false
        });

        // 2. Log to Firestore alerts
        if (fallStatus) {
            await addDoc(collection(db, 'alerts'), {
                patientId,
                patientName,
                type: 'fall',
                gForce: fallStatus.g_force,
                timestamp: serverTimestamp(),
                resolved: true,
                resolvedAt: serverTimestamp(),
            });
        }
    };

    return { fallStatus, resolveFall };
};

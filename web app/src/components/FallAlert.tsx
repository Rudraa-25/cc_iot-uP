import React from 'react';
import { AlertTriangle, Clock, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FallAlertProps {
    isVisible: boolean;
    gForce: number;
    timestamp: any;
    onResolve: () => void;
}

export const FallAlert: React.FC<FallAlertProps> = ({ isVisible, gForce, timestamp, onResolve }) => {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-accent-red/20 backdrop-blur-md"
                >
                    <motion.div
                        initial={{ scale: 0.8, rotate: -5 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="bg-bg-card border-4 border-accent-red p-8 rounded-3xl max-w-md w-full shadow-[0_0_50px_rgba(255,71,87,0.5)] text-center animate-shake"
                    >
                        <div className="flex justify-center mb-6">
                            <div className="bg-accent-red p-4 rounded-full animate-pulse-glow">
                                <AlertTriangle className="w-12 h-12 text-white" />
                            </div>
                        </div>

                        <h2 className="text-4xl font-extrabold text-white mb-2">⚠️ FALL DETECTED</h2>
                        <p className="text-text-secondary mb-8">An emergency event has been triggered from the wearable device.</p>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-bg-secondary p-4 rounded-2xl flex flex-col items-center">
                                <Activity className="w-5 h-5 text-accent-red mb-1" />
                                <span className="text-xs text-text-secondary">Impact</span>
                                <span className="text-lg font-bold font-mono">{gForce.toFixed(2)}G</span>
                            </div>
                            <div className="bg-bg-secondary p-4 rounded-2xl flex flex-col items-center">
                                <Clock className="w-5 h-5 text-accent-cyan mb-1" />
                                <span className="text-xs text-text-secondary">Time</span>
                                <span className="text-lg font-bold font-mono">
                                    {timestamp ? new Date(timestamp).toLocaleTimeString() : 'Just now'}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={onResolve}
                            className="w-full bg-accent-red hover:bg-accent-red/80 text-white font-black py-4 rounded-2xl transition-all shadow-lg hover:shadow-accent-red/20"
                        >
                            MARK AS RESOLVED
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

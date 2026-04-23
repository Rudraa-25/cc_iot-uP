import React from 'react';
import { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface VitalCardProps {
    title: string;
    value: string | number;
    unit: string;
    icon: LucideIcon;
    color: 'red' | 'blue' | 'orange' | 'teal';
    status: 'Normal' | 'Elevated' | 'Critical' | 'Low O2' | 'Fever' | 'Warning';
    statusColor: string;
    animateIcon?: boolean;
}

export const VitalCard: React.FC<VitalCardProps> = ({
    title, value, unit, icon: Icon, color, status, statusColor, animateIcon
}) => {
    const accentColors = {
        red: 'text-accent-red border-accent-red/20',
        blue: 'text-accent-cyan border-accent-cyan/20',
        orange: 'text-accent-orange border-accent-orange/20',
        teal: 'text-accent-green border-accent-green/20'
    };

    return (
        <div className="card p-6 flex flex-col justify-between group">
            <div className="flex justify-between items-start mb-4">
                <div className={clsx(
                    "p-3 rounded-xl border",
                    accentColors[color]
                )}>
                    <Icon className={clsx(
                        "w-6 h-6",
                        animateIcon && color === 'red' && "animate-heart-beat"
                    )} />
                </div>
                <span className={clsx(
                    "text-xs font-bold px-2 py-1 rounded-full",
                    statusColor
                )}>
                    {status}
                </span>
            </div>

            <div>
                <h3 className="text-text-secondary text-sm font-medium">{title}</h3>
                <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-bold font-mono tracking-tighter tabular-nums">
                        {value}
                    </span>
                    <span className="text-text-secondary text-sm font-medium">{unit}</span>
                </div>
            </div>

            <div className="mt-4 h-1 w-full bg-bg-secondary rounded-full overflow-hidden">
                <div
                    className={clsx(
                        "h-full transition-all duration-1000",
                        color === 'red' && "bg-accent-red",
                        color === 'blue' && "bg-accent-cyan",
                        color === 'orange' && "bg-accent-orange",
                        color === 'teal' && "bg-accent-green"
                    )}
                    style={{ width: '70%' }}
                />
            </div>
        </div>
    );
};

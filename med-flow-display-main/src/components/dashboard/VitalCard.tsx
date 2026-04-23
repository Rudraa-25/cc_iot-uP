import { useMemo } from "react";

interface VitalCardProps {
  label: string;
  value: number;
  unit: string;
  icon: React.ReactNode;
  colorVar: string;
  min: number;
  max: number;
  thresholds?: { low: number; high: number };
  large?: boolean;
}

export function VitalCard({ label, value, unit, icon, colorVar, min, max, thresholds, large }: VitalCardProps) {
  const percentage = useMemo(() => {
    return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  }, [value, min, max]);

  const isAbnormal = thresholds ? value < thresholds.low || value > thresholds.high : false;

  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`vital-card group ${isAbnormal ? "vital-card-alert" : ""} ${large ? "col-span-1" : ""}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-neon-primary">{icon}</span>
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg viewBox="0 0 110 110" className="w-full h-full -rotate-90">
            <circle cx="55" cy="55" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
            <circle
              cx="55" cy="55" r={radius} fill="none"
              stroke={`hsl(var(--${colorVar}))`}
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={dashOffset}
              className="gauge-ring"
              style={{ filter: `drop-shadow(0 0 6px hsl(var(--${colorVar}) / 0.5))` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-bold font-mono ${isAbnormal ? "text-destructive" : "text-card-foreground"}`}>
              {value || "--"}
            </span>
          </div>
        </div>
        <div>
          <span className="text-xs text-muted-foreground">{unit}</span>
          {isAbnormal && (
            <div className="mt-1 text-xs text-destructive font-medium animate-pulse">⚠ Abnormal</div>
          )}
        </div>
      </div>
    </div>
  );
}

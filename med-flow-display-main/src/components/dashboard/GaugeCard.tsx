import { useMemo } from "react";

interface GaugeCardProps {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  colorVar: string;
  icon: React.ReactNode;
  thresholds?: { low: number; high: number };
}

export function GaugeCard({ label, value, unit, min, max, colorVar, icon, thresholds }: GaugeCardProps) {
  const percentage = useMemo(() => {
    return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  }, [value, min, max]);

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (percentage / 100) * circumference;

  const isAbnormal = thresholds
    ? value < thresholds.low || value > thresholds.high
    : false;

  return (
    <div className={`vital-card flex flex-col items-center gap-3 ${isAbnormal ? "border-destructive/50" : ""}`}>
      <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
        {icon}
        <span>{label}</span>
      </div>

      <div className="relative w-32 h-32">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={`hsl(var(--${colorVar}))`}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="gauge-ring"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold font-mono ${isAbnormal ? "text-destructive" : "text-card-foreground"}`}>
            {value}
          </span>
          <span className="text-xs text-muted-foreground">{unit}</span>
        </div>
      </div>
    </div>
  );
}

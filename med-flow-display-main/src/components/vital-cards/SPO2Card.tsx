import { useRef, useEffect, useMemo } from 'react';
import { getSPO2Status, getCardClass, getStatusLabel, STATUS_COLORS } from '@/utils/status';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface SPO2CardProps {
  value: number | null;
  sparklineData: number[];
}

export function SPO2Card({ value, sparklineData }: SPO2CardProps) {
  const status = getSPO2Status(value);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    cardRef.current?.classList.remove('data-flash');
    void cardRef.current?.offsetWidth;
    cardRef.current?.classList.add('data-flash');
  }, [value]);

  const pct = value ?? 0;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (pct / 100) * circumference;

  const chartData = sparklineData.map((v, i) => ({ i, v }));

  return (
    <div ref={cardRef} className={getCardClass(status)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-body uppercase tracking-wider text-t2">SpO₂</span>
        <span
          className="text-[10px] font-mono px-2 py-0.5 rounded-full"
          style={{ color: STATUS_COLORS[status], backgroundColor: `${STATUS_COLORS[status]}20` }}
        >
          {getStatusLabel(status)}
        </span>
      </div>

      <div className="flex items-center gap-4 mb-3">
        <div className="relative w-28 h-28 flex-shrink-0">
          <svg viewBox="0 0 120 120" className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="60" cy="60" r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
            <circle
              cx="60" cy="60" r={radius} fill="none"
              stroke={STATUS_COLORS[status]}
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{
                transition: 'stroke-dashoffset 0.8s ease',
                filter: `drop-shadow(0 0 6px ${STATUS_COLORS[status]}80)`,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-mono font-bold vital-number" style={{ color: STATUS_COLORS[status] }}>
              {value ?? '--'}
            </span>
            <span className="text-xs text-t2">%</span>
          </div>
        </div>
      </div>

      <div className="h-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="spo2Grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00E5FF" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#00E5FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke="#00E5FF" strokeWidth={2} fill="url(#spo2Grad)" dot={false} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

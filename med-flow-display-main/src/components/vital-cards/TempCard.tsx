import { useRef, useEffect } from 'react';
import { Thermometer } from 'lucide-react';
import { getTempStatus, getCardClass, getStatusLabel, STATUS_COLORS } from '@/utils/status';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface TempCardProps {
  value: number | null;
  sparklineData: number[];
}

function getTempLabel(v: number | null): string {
  if (v == null || v === 0) return 'NO DATA';
  if (v < 35) return 'HYPOTHERMIA';
  if (v > 39.5) return 'HIGH FEVER';
  if (v > 38.5) return 'FEVER';
  if (v > 37.5) return 'LOW FEVER';
  return 'NORMAL';
}

export function TempCard({ value, sparklineData }: TempCardProps) {
  const status = getTempStatus(value);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    cardRef.current?.classList.remove('data-flash');
    void cardRef.current?.offsetWidth;
    cardRef.current?.classList.add('data-flash');
  }, [value]);

  const fillPct = value ? Math.min(100, Math.max(0, ((value - 35) / 7) * 100)) : 0;
  const fahrenheit = value ? ((value * 9) / 5 + 32).toFixed(1) : '--';

  const chartData = sparklineData.map((v, i) => ({ i, v }));

  return (
    <div ref={cardRef} className={getCardClass(status)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Thermometer className="w-4 h-4" style={{ color: '#FF6D00' }} />
          <span className="text-xs font-body uppercase tracking-wider text-t2">Body Temp</span>
        </div>
        <span
          className="text-[10px] font-mono px-2 py-0.5 rounded-full"
          style={{ color: STATUS_COLORS[status], backgroundColor: `${STATUS_COLORS[status]}20` }}
        >
          {getTempLabel(value)}
        </span>
      </div>

      <div className="flex items-center gap-4 mb-3">
        <div className="w-6 h-20 rounded-full border border-t3 relative overflow-hidden flex-shrink-0">
          <div
            className="absolute bottom-0 left-0 right-0 rounded-full transition-all duration-700"
            style={{ height: `${fillPct}%`, backgroundColor: '#FF6D00' }}
          />
        </div>
        <div>
          <span className="text-4xl font-mono font-bold vital-number" style={{ color: '#FF6D00' }}>
            {value?.toFixed(1) ?? '--'}
          </span>
          <span className="text-sm text-t2 ml-1">°C</span>
          <div className="text-xs text-t3 mt-1">{fahrenheit}°F</div>
        </div>
      </div>

      <div className="h-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF6D00" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#FF6D00" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke="#FF6D00" strokeWidth={2} fill="url(#tempGrad)" dot={false} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

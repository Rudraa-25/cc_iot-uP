import { useMemo, useRef, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { getHRStatus, getCardClass, getStatusLabel, STATUS_COLORS } from '@/utils/status';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface HeartRateCardProps {
  value: number | null;
  sparklineData: number[];
}

export function HeartRateCard({ value, sparklineData }: HeartRateCardProps) {
  const status = getHRStatus(value);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    cardRef.current?.classList.remove('data-flash');
    void cardRef.current?.offsetWidth;
    cardRef.current?.classList.add('data-flash');
  }, [value]);

  const heartDuration = useMemo(() => {
    if (!value || value === 0) return '1s';
    return `${(60 / value).toFixed(2)}s`;
  }, [value]);

  const chartData = sparklineData.map((v, i) => ({ i, v }));

  return (
    <div ref={cardRef} className={getCardClass(status)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Heart
            className="w-5 h-5"
            style={{
              color: STATUS_COLORS[status],
              animation: value ? `heartbeat ${heartDuration} ease-in-out infinite` : 'none',
            }}
            fill={STATUS_COLORS[status]}
          />
          <span className="text-xs font-body uppercase tracking-wider text-t2">Heart Rate</span>
        </div>
        <span
          className="text-[10px] font-mono px-2 py-0.5 rounded-full"
          style={{
            color: STATUS_COLORS[status],
            backgroundColor: `${STATUS_COLORS[status]}20`,
          }}
        >
          {getStatusLabel(status)}
        </span>
      </div>

      <div className="flex items-end gap-2 mb-3">
        <span
          className="text-5xl font-mono font-bold vital-number"
          style={{ color: STATUS_COLORS[status] }}
        >
          {value ?? '--'}
        </span>
        <span className="text-sm text-t2 mb-1 font-body">BPM</span>
      </div>

      <div className="h-12">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={STATUS_COLORS[status]} stopOpacity={0.3} />
                <stop offset="100%" stopColor={STATUS_COLORS[status]} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke={STATUS_COLORS[status]}
              strokeWidth={2}
              fill="url(#hrGrad)"
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

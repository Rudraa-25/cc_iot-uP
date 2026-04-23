import { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Line, ComposedChart,
} from 'recharts';
import { format } from 'date-fns';
import type { Vital } from '@/types/database';

interface VitalChartProps {
  title: string;
  data: Vital[];
  dataKey: keyof Vital;
  color: string;
  unit: string;
  domain?: [number, number];
  secondaryKey?: keyof Vital;
  secondaryColor?: string;
}

export function VitalAreaChart({ title, data, dataKey, color, unit, domain, secondaryKey, secondaryColor }: VitalChartProps) {
  const chartData = useMemo(() =>
    data.map(d => ({
      time: d.recorded_at ? new Date(d.recorded_at).getTime() : 0,
      [dataKey]: d[dataKey],
      ...(secondaryKey ? { [secondaryKey]: d[secondaryKey] } : {}),
    })),
    [data, dataKey, secondaryKey]
  );

  const gradientId = `grad-${dataKey as string}`;

  if (secondaryKey) {
    return (
      <div className="cp-card">
        <div className="text-xs font-body uppercase tracking-wider text-t2 mb-3">{title}</div>
        <div className="h-[150px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1A2535" strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                tickFormatter={(v: number) => format(new Date(v), 'HH:mm:ss')}
                tick={{ fontSize: 10, fill: 'hsl(215, 15%, 30%)' }}
                axisLine={false} tickLine={false}
              />
              <YAxis domain={domain} tick={{ fontSize: 10, fill: 'hsl(215, 15%, 30%)' }} axisLine={false} tickLine={false} width={35} />
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid #1A2535', borderRadius: '8px', fontSize: '12px', color: '#E6EDF3' }}
                labelFormatter={(v: number) => format(new Date(v), 'HH:mm:ss')}
                formatter={(val: number, name: string) => [`${val}${unit}`, name]}
              />
              <Area type="monotone" dataKey={dataKey as string} stroke={color} strokeWidth={2} fill={`url(#${gradientId})`} dot={false} isAnimationActive={true} animationDuration={800} />
              <Line type="monotone" dataKey={secondaryKey as string} stroke={secondaryColor} strokeWidth={2} dot={false} isAnimationActive={true} animationDuration={800} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  return (
    <div className="cp-card">
      <div className="text-xs font-body uppercase tracking-wider text-t2 mb-3">{title}</div>
      <div className="h-[150px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
              <filter id={`glow-${dataKey as string}`}>
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <CartesianGrid stroke="#1A2535" strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              tickFormatter={(v: number) => format(new Date(v), 'HH:mm:ss')}
              tick={{ fontSize: 10, fill: 'hsl(215, 15%, 30%)' }}
              axisLine={false} tickLine={false}
            />
            <YAxis domain={domain} tick={{ fontSize: 10, fill: 'hsl(215, 15%, 30%)' }} axisLine={false} tickLine={false} width={35} />
            <Tooltip
              contentStyle={{ background: '#111827', border: '1px solid #1A2535', borderRadius: '8px', fontSize: '12px', color: '#E6EDF3' }}
              labelFormatter={(v: number) => format(new Date(v), 'HH:mm:ss')}
              formatter={(val: number) => [`${val}${unit}`, title]}
            />
            <Area
              type="monotone" dataKey={dataKey as string} stroke={color} strokeWidth={2}
              fill={`url(#${gradientId})`} dot={false}
              isAnimationActive={true} animationDuration={800}
              style={{ filter: `url(#glow-${dataKey as string})` }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { format } from 'date-fns';

interface VitalChartProps {
    data: any[];
    dataKey: string;
    color: string;
    title: string;
    unit: string;
}

export const VitalChart: React.FC<VitalChartProps> = ({ data, dataKey, color, title, unit }) => {
    return (
        <div className="card p-6 h-[300px]">
            <h3 className="text-lg font-bold mb-4">{title} ({unit})</h3>
            <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <defs>
                            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="3" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E2D40" vertical={false} />
                        <XAxis
                            dataKey="timestamp"
                            hide
                        />
                        <YAxis
                            domain={['auto', 'auto']}
                            stroke="#8892A4"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1A2235',
                                border: '1px solid #1E2D40',
                                borderRadius: '12px'
                            }}
                            labelFormatter={(value) => format(value, 'HH:mm:ss')}
                        />
                        <Line
                            type="monotone"
                            dataKey={dataKey}
                            stroke={color}
                            strokeWidth={3}
                            dot={false}
                            animationDuration={1000}
                            filter="url(#glow)"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

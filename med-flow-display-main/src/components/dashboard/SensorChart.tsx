import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { SensorData } from "@/hooks/useSerial";
import { useMemo } from "react";

interface SensorChartProps {
  title: string;
  data: SensorData[];
  dataKey: keyof SensorData | "accel_magnitude";
  color: string;
  unit: string;
  icon: React.ReactNode;
  domain?: [number, number];
}

export function SensorChart({ title, data, dataKey, color, unit, icon, domain }: SensorChartProps) {
  const chartData = useMemo(() => {
    // Show last 60 data points
    const slice = data.slice(-60);
    return slice.map((d, i) => {
      let value: number;
      if (dataKey === "accel_magnitude") {
        value = Math.sqrt(d.accel_x ** 2 + d.accel_y ** 2 + d.accel_z ** 2);
        value = Math.round(value * 100) / 100;
      } else {
        value = d[dataKey] as number;
      }
      return { index: i, value, time: `${Math.round((d.timestamp_ms || 0) / 1000)}s` };
    });
  }, [data, dataKey]);

  const latestValue = chartData.length > 0 ? chartData[chartData.length - 1].value : null;

  return (
    <div className="vital-card">
      <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium mb-3">
        <span className="text-neon-primary">{icon}</span>
        <span>{title}</span>
        <span className="ml-auto font-mono text-card-foreground text-lg font-bold" style={{ color }}>
          {latestValue !== null ? `${latestValue}${unit}` : "--"}
        </span>
      </div>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false} axisLine={false}
            />
            <YAxis
              domain={domain || ["auto", "auto"]}
              tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false} axisLine={false} width={35}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "11px",
                color: "hsl(var(--card-foreground))",
              }}
              formatter={(val: number) => [`${val}${unit}`, title]}
            />
            <Line
              type="monotone" dataKey="value" stroke={color}
              strokeWidth={2} dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
              style={{ filter: `drop-shadow(0 0 4px ${color})` }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

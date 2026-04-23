import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { HealthData } from "@/hooks/useWebSocket";

interface VitalChartProps {
  title: string;
  data: HealthData[];
  dataKey: keyof HealthData;
  color: string;
  unit: string;
  icon: React.ReactNode;
  domain?: [number, number];
}

export function VitalChart({ title, data, dataKey, color, unit, icon, domain }: VitalChartProps) {
  const chartData = data.map((d, i) => ({
    index: i,
    value: d[dataKey] as number,
    time: new Date(d.timestamp).toLocaleTimeString(),
  }));

  return (
    <div className="vital-card">
      <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium mb-4">
        {icon}
        <span>{title}</span>
        <span className="ml-auto font-mono text-card-foreground text-lg font-bold">
          {chartData.length > 0 ? `${chartData[chartData.length - 1].value}${unit}` : "--"}
        </span>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={domain || ["auto", "auto"]}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              width={35}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(val: number) => [`${val}${unit}`, title]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

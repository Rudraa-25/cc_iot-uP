import { Activity, Heart, Droplets, Thermometer, Wind, Gauge, Sun } from "lucide-react";
import { useSerial } from "@/hooks/useSerial";
import { VitalCard } from "@/components/dashboard/VitalCard";
import { SensorChart } from "@/components/dashboard/SensorChart";
import { FallIndicator } from "@/components/dashboard/FallIndicator";
import { SerialConnect } from "@/components/dashboard/SerialConnect";
import { AlertLog } from "@/components/dashboard/AlertLog";
import { RawJsonViewer } from "@/components/dashboard/RawJsonViewer";
import { CSVExport } from "@/components/dashboard/CSVExport";
import { ThemeToggle } from "@/components/dashboard/ThemeToggle";

const Index = () => {
  const { data, history, alerts, isConnected, error, connect, disconnect, rawJson, parseErrors } = useSerial();

  const heartRate = data?.heart_rate ?? 0;
  const spo2 = data?.spo2 ?? 0;
  const bodyTemp = data?.body_temp_c ?? 0;
  const ambientTemp = data?.ambient_temp_c ?? 0;
  const humidity = data?.humidity ?? 0;
  const fallDetected = data?.fall_detected ?? false;
  const alertActive = data?.alert_active ?? false;
  const alertReason = data?.alert_reason ?? "";
  const timestamp = data?.timestamp_ms ?? null;

  return (
    <div className="min-h-screen bg-background dark">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: "hsl(var(--neon-primary) / 0.1)" }}>
              <Activity className="w-6 h-6 text-neon-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">
                IoT Cloud Healthcare Dashboard
              </h1>
              <p className="text-xs text-muted-foreground">ESP32 Serial Monitor — Real-time patient vitals</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CSVExport history={history} />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Connection */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <SerialConnect
            isConnected={isConnected}
            error={error}
            onConnect={connect}
            onDisconnect={disconnect}
          />
          {timestamp && (
            <span className="text-xs text-muted-foreground font-mono">
              Last: {new Date(timestamp).toLocaleTimeString()} | Baud: 115200
            </span>
          )}
        </div>

        {/* Fall / Alert */}
        <FallIndicator fallDetected={fallDetected} alertActive={alertActive} alertReason={alertReason} />

        {/* Vital Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <VitalCard
            label="Heart Rate" value={heartRate} unit="bpm"
            icon={<Heart className="w-4 h-4" />} colorVar="chart-heart"
            min={0} max={200} thresholds={{ low: 50, high: 120 }}
          />
          <VitalCard
            label="SpO₂" value={spo2} unit="%"
            icon={<Droplets className="w-4 h-4" />} colorVar="chart-spo2"
            min={80} max={100} thresholds={{ low: 90, high: 101 }}
          />
          <VitalCard
            label="Body Temp" value={bodyTemp} unit="°C"
            icon={<Thermometer className="w-4 h-4" />} colorVar="chart-temp"
            min={34} max={42} thresholds={{ low: 35, high: 38.5 }}
          />
          <VitalCard
            label="Ambient" value={ambientTemp} unit="°C"
            icon={<Sun className="w-4 h-4" />} colorVar="chart-humidity"
            min={10} max={50}
          />
          <VitalCard
            label="Humidity" value={humidity} unit="%"
            icon={<Wind className="w-4 h-4" />} colorVar="chart-humidity"
            min={0} max={100}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SensorChart
            title="Heart Rate" data={history} dataKey="heart_rate"
            color="hsl(var(--chart-heart))" unit=" bpm"
            icon={<Heart className="w-4 h-4" />} domain={[40, 180]}
          />
          <SensorChart
            title="SpO₂" data={history} dataKey="spo2"
            color="hsl(var(--chart-spo2))" unit="%"
            icon={<Droplets className="w-4 h-4" />} domain={[85, 100]}
          />
          <SensorChart
            title="Body Temperature" data={history} dataKey="body_temp_c"
            color="hsl(var(--chart-temp))" unit="°C"
            icon={<Thermometer className="w-4 h-4" />} domain={[34, 42]}
          />
          <SensorChart
            title="Acceleration Magnitude" data={history} dataKey="accel_magnitude"
            color="hsl(var(--chart-accel))" unit=" m/s²"
            icon={<Gauge className="w-4 h-4" />} domain={[0, 20]}
          />
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AlertLog alerts={alerts} />
          <RawJsonViewer rawJson={rawJson} parseErrors={parseErrors} />
        </div>

        <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border">
          Web Serial API • Baud 115200 • Chrome/Edge required
        </div>
      </main>
    </div>
  );
};

export default Index;

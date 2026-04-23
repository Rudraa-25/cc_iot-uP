import { SensorData } from "@/hooks/useSerial";
import { Download } from "lucide-react";

interface CSVExportProps {
  history: SensorData[];
}

export function CSVExport({ history }: CSVExportProps) {
  const exportCSV = () => {
    if (history.length === 0) return;

    const headers = [
      "timestamp_ms", "heart_rate", "spo2", "body_temp_c", "ambient_temp_c",
      "humidity", "accel_x", "accel_y", "accel_z", "accel_magnitude",
      "fall_detected", "alert_active", "alert_reason",
    ];

    const rows = history.map((d) => [
      d.timestamp_ms, d.heart_rate, d.spo2, d.body_temp_c, d.ambient_temp_c,
      d.humidity, d.accel_x, d.accel_y, d.accel_z,
      Math.round(Math.sqrt(d.accel_x ** 2 + d.accel_y ** 2 + d.accel_z ** 2) * 100) / 100,
      d.fall_detected, d.alert_active, `"${d.alert_reason || ""}"`,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sensor-data-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={exportCSV}
      disabled={history.length === 0}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neon-primary/10 text-neon-primary text-sm font-medium hover:bg-neon-primary/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed border border-neon-primary/20"
    >
      <Download className="w-4 h-4" />
      Export CSV ({history.length})
    </button>
  );
}

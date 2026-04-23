import { AlertEntry } from "@/hooks/useSerial";
import { Clock } from "lucide-react";

interface AlertLogProps {
  alerts: AlertEntry[];
}

export function AlertLog({ alerts }: AlertLogProps) {
  if (alerts.length === 0) {
    return (
      <div className="vital-card">
        <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
          <Clock className="w-4 h-4" /> Alert History
        </h3>
        <p className="text-xs text-muted-foreground">No alerts recorded.</p>
      </div>
    );
  }

  return (
    <div className="vital-card">
      <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
        <Clock className="w-4 h-4 text-neon-primary" /> Alert History ({alerts.length})
      </h3>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {alerts.map((alert, i) => (
          <div key={i} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-destructive/10 border border-destructive/20">
            <span className="w-2 h-2 rounded-full bg-destructive flex-shrink-0" />
            <span className="text-destructive font-medium flex-1">{alert.reason}</span>
            <span className="text-muted-foreground font-mono">
              {new Date(alert.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

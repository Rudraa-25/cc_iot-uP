import { AlertTriangle, ShieldCheck } from "lucide-react";

interface FallIndicatorProps {
  fallDetected: boolean;
  alertActive: boolean;
  alertReason: string;
}

export function FallIndicator({ fallDetected, alertActive, alertReason }: FallIndicatorProps) {
  if (fallDetected || alertActive) {
    return (
      <div className="vital-card border-destructive bg-destructive/10 alert-flash">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-destructive/20">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <div>
            <h3 className="font-bold text-destructive text-lg">
              {fallDetected ? "⚠ FALL DETECTED" : "⚠ ALERT ACTIVE"}
            </h3>
            <p className="text-sm text-destructive/80">
              {alertReason || "Immediate attention required"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="vital-card border-neon-primary/30">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-full bg-neon-primary/10">
          <ShieldCheck className="w-7 h-7 text-neon-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-card-foreground">Status: Normal</h3>
          <p className="text-sm text-muted-foreground">No falls or alerts detected</p>
        </div>
      </div>
    </div>
  );
}

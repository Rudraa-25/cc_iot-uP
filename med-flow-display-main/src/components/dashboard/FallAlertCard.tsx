import { AlertTriangle, ShieldCheck } from "lucide-react";

interface FallAlertCardProps {
  fallDetected: boolean;
}

export function FallAlertCard({ fallDetected }: FallAlertCardProps) {
  if (fallDetected) {
    return (
      <div className="vital-card border-destructive bg-destructive/10 alert-flash">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-destructive/20">
            <AlertTriangle className="w-7 h-7 text-destructive" />
          </div>
          <div>
            <h3 className="font-bold text-destructive text-lg">FALL DETECTED</h3>
            <p className="text-sm text-destructive/80">Immediate attention required</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="vital-card border-success/30">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-full bg-success/10">
          <ShieldCheck className="w-7 h-7 text-success" />
        </div>
        <div>
          <h3 className="font-semibold text-card-foreground">No Falls Detected</h3>
          <p className="text-sm text-muted-foreground">Patient status normal</p>
        </div>
      </div>
    </div>
  );
}

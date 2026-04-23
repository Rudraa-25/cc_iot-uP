import { Wifi, WifiOff } from "lucide-react";

interface ConnectionStatusProps {
  isConnected: boolean;
  error: string | null;
  lastTimestamp: number | null;
}

export function ConnectionStatus({ isConnected, error, lastTimestamp }: ConnectionStatusProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-sm">
      <div className="flex items-center gap-2">
        <span className={`pulse-dot ${isConnected ? "pulse-dot-connected" : "pulse-dot-disconnected"}`} />
        {isConnected ? (
          <span className="flex items-center gap-1.5 text-success font-medium">
            <Wifi className="w-4 h-4" /> Connected
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-destructive font-medium">
            <WifiOff className="w-4 h-4" /> Disconnected
          </span>
        )}
      </div>

      {error && !isConnected && (
        <span className="text-destructive/80 text-xs">{error}</span>
      )}

      {lastTimestamp && (
        <span className="text-muted-foreground text-xs font-mono ml-auto">
          Last update: {new Date(lastTimestamp).toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}

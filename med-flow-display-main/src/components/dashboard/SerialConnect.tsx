import { Usb, Wifi, WifiOff } from "lucide-react";

interface SerialConnectProps {
  isConnected: boolean;
  error: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function SerialConnect({ isConnected, error, onConnect, onDisconnect }: SerialConnectProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <button
        onClick={isConnected ? onDisconnect : onConnect}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
          isConnected
            ? "bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20"
            : "bg-neon-primary/10 text-neon-primary border border-neon-primary/30 hover:bg-neon-primary/20 neon-glow-btn"
        }`}
      >
        <Usb className="w-4 h-4" />
        {isConnected ? "Disconnect" : "Connect ESP32"}
      </button>

      <div className="flex items-center gap-2 text-sm">
        <span className={`pulse-dot ${isConnected ? "pulse-dot-connected" : "pulse-dot-disconnected"}`} />
        {isConnected ? (
          <span className="flex items-center gap-1.5 text-neon-primary font-medium">
            <Wifi className="w-4 h-4" /> Connected
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
            <WifiOff className="w-4 h-4" /> Disconnected
          </span>
        )}
      </div>

      {error && (
        <span className="text-destructive text-xs">{error}</span>
      )}
    </div>
  );
}

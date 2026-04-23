import { useState, useEffect } from 'react';
import { Cloud, Wifi, Server } from 'lucide-react';
import type { Device } from '@/types/database';

interface DeviceStatusCardProps {
  bleState?: string;
  lastUpdate: Date | null;
  device: Device | null;
}

export function DeviceStatusCard({ lastUpdate, device }: DeviceStatusCardProps) {
  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      if (lastUpdate) {
        setSecondsAgo(Math.floor((Date.now() - lastUpdate.getTime()) / 1000));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [lastUpdate]);

  const isDeviceOnline = device?.is_online ?? false;
  const isDeviceStale = device?.last_seen
    ? Date.now() - new Date(device.last_seen).getTime() > 20000
    : true;

  const isLive = isDeviceOnline && !isDeviceStale;

  return (
    <div className="cp-card" style={{ borderColor: isLive ? 'var(--green-raw)' : 'hsl(var(--border))' }}>
      <div className="flex items-center gap-2 mb-4">
        <Server className="w-4 h-4 text-t2" />
        <span className="text-xs font-body uppercase tracking-wider text-t2">Device Status</span>
      </div>

      {/* Connection indicator */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: isLive ? 'var(--green-glow)' : 'rgba(61,71,86,0.2)' }}
          >
            <Wifi className="w-5 h-5" style={{ color: isLive ? 'var(--green-raw)' : 'hsl(var(--t3))' }} />
          </div>
          {isLive && (
            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--green-raw)', animation: 'pulse 2s infinite' }} />
          )}
        </div>
        <div>
          <div className="text-sm font-display font-bold" style={{ color: isLive ? 'var(--green-raw)' : 'hsl(var(--t3))' }}>
            {isLive ? 'Online' : 'Offline'}
          </div>
          <div className="text-xs text-t3 font-mono">
            {lastUpdate ? `Last data ${secondsAgo}s ago` : 'Waiting for data...'}
          </div>
        </div>
      </div>

      {/* Cloud sync */}
      <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg" style={{ backgroundColor: 'hsl(var(--elevated))' }}>
        <Cloud className="w-3.5 h-3.5" style={{ color: isLive ? 'var(--green-raw)' : 'hsl(var(--t3))' }} />
        <span className="text-xs text-t2 font-body">
          {isLive ? 'Supabase synced' : 'No sync'}
        </span>
      </div>

      {/* Device info */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="px-2 py-0.5 rounded text-[10px] font-mono text-t3" style={{ backgroundColor: 'hsl(var(--elevated))' }}>
          {device?.device_id ?? 'esp32-chainpulse-001'}
        </span>
        {device?.firmware_ver && (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono text-t3" style={{ backgroundColor: 'hsl(var(--elevated))' }}>
            FW v{device.firmware_ver}
          </span>
        )}
      </div>
    </div>
  );
}

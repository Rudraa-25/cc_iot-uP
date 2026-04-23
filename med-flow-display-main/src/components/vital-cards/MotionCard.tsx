import { useRef, useEffect } from 'react';
import { getGForceStatus, getCardClass, getStatusLabel, STATUS_COLORS } from '@/utils/status';

interface MotionCardProps {
  gForce: number | null;
  roll: number | null;
  pitch: number | null;
  gyroX: number | null;
  gyroY: number | null;
  gyroZ: number | null;
  fallDetected: boolean;
}

export function MotionCard({ gForce, roll, pitch, gyroX, gyroY, gyroZ, fallDetected }: MotionCardProps) {
  const status = getGForceStatus(gForce, fallDetected);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    cardRef.current?.classList.remove('data-flash');
    void cardRef.current?.offsetWidth;
    cardRef.current?.classList.add('data-flash');
  }, [gForce]);

  const gPct = Math.min(1, (gForce ?? 0) / 4);
  const arcAngle = gPct * 180;
  const r = 40;
  const rad = (arcAngle * Math.PI) / 180;
  const x = 50 + r * Math.cos(Math.PI - rad);
  const y = 55 - r * Math.sin(Math.PI - rad);

  return (
    <div ref={cardRef} className={getCardClass(status)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-body uppercase tracking-wider text-t2">Motion (MPU6050)</span>
        <span
          className="text-[10px] font-mono px-2 py-0.5 rounded-full"
          style={{ color: STATUS_COLORS[status], backgroundColor: `${STATUS_COLORS[status]}20` }}
        >
          {fallDetected ? 'FALL!' : getStatusLabel(status)}
        </span>
      </div>

      <div className="flex items-center gap-4 mb-3">
        {/* 3D device tilt */}
        <div
          className="w-16 h-20 rounded-lg border-2 flex-shrink-0 flex items-center justify-center"
          style={{
            borderColor: STATUS_COLORS[status],
            transform: `perspective(400px) rotateX(${-(pitch ?? 0)}deg) rotateY(${roll ?? 0}deg)`,
            transition: 'transform 0.3s ease',
            transformStyle: 'preserve-3d',
            backgroundColor: `${STATUS_COLORS[status]}10`,
          }}
        >
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[status] }} />
        </div>

        {/* G-Force arc */}
        <div className="flex-1">
          <svg viewBox="0 0 100 60" className="w-full h-12">
            <path
              d="M 10 55 A 40 40 0 0 1 90 55"
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path
              d={`M 10 55 A 40 40 0 0 1 ${x} ${y}`}
              fill="none"
              stroke={STATUS_COLORS[status]}
              strokeWidth="6"
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 4px ${STATUS_COLORS[status]}80)` }}
            />
          </svg>
          <div className="text-center">
            <span className="text-xl font-mono font-bold vital-number" style={{ color: STATUS_COLORS[status] }}>
              {gForce?.toFixed(2) ?? '--'}
            </span>
            <span className="text-xs text-t2 ml-1">G</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: 'Roll', val: roll },
          { label: 'Pitch', val: pitch },
          { label: 'GyroX', val: gyroX },
          { label: 'GyroY', val: gyroY },
          { label: 'GyroZ', val: gyroZ },
        ].map(({ label, val }) => (
          <div key={label} className="bg-elevated/50 rounded px-1.5 py-1">
            <div className="text-[9px] text-t3 uppercase">{label}</div>
            <div className="text-xs font-mono text-t1">{val?.toFixed(1) ?? '--'}°</div>
          </div>
        ))}
      </div>
    </div>
  );
}

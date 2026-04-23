import { useRef, useEffect } from 'react';
import { Droplets, Thermometer } from 'lucide-react';

interface EnvCardProps {
  tempAmbient: number | null;
  humidity: number | null;
}

export function EnvCard({ tempAmbient, humidity }: EnvCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    cardRef.current?.classList.remove('data-flash');
    void cardRef.current?.offsetWidth;
    cardRef.current?.classList.add('data-flash');
  }, [tempAmbient, humidity]);

  const humPct = humidity ?? 0;

  return (
    <div ref={cardRef} className="cp-card" style={{ borderColor: 'var(--teal-raw)' }}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-body uppercase tracking-wider text-t2">Environment</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Ambient Temp */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Thermometer className="w-3.5 h-3.5" style={{ color: 'var(--teal-raw)' }} />
            <span className="text-[10px] text-t3 uppercase">Ambient</span>
          </div>
          <span className="text-2xl font-mono font-bold vital-number" style={{ color: 'var(--teal-raw)' }}>
            {tempAmbient?.toFixed(1) ?? '--'}
          </span>
          <span className="text-xs text-t2 ml-1">°C</span>
        </div>

        {/* Humidity with wave */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Droplets className="w-3.5 h-3.5" style={{ color: '#00BCD4' }} />
            <span className="text-[10px] text-t3 uppercase">Humidity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full border border-t3 relative overflow-hidden">
              <div
                className="absolute bottom-0 left-0 right-0 transition-all duration-700"
                style={{ height: `${humPct}%`, backgroundColor: 'rgba(0,188,212,0.3)' }}
              >
                <div
                  className="wave-anim absolute top-0 left-0 w-[200%] h-2"
                  style={{
                    background: 'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(0,188,212,0.4) 10px, rgba(0,188,212,0.4) 20px)',
                  }}
                />
              </div>
            </div>
            <div>
              <span className="text-2xl font-mono font-bold vital-number" style={{ color: '#00BCD4' }}>
                {humidity?.toFixed(1) ?? '--'}
              </span>
              <span className="text-xs text-t2 ml-1">%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import type { StatusLevel } from '@/types/database';

export const STATUS_COLORS: Record<StatusLevel, string> = {
  normal: '#00E676',
  warning: '#FFB300',
  critical: '#FF1744',
  unknown: '#3D4756',
};

export function getHRStatus(v: number | null): StatusLevel {
  if (v == null || v === 0) return 'unknown';
  if (v < 50 || v > 120) return 'critical';
  if (v < 60 || v > 100) return 'warning';
  return 'normal';
}

export function getSPO2Status(v: number | null): StatusLevel {
  if (v == null || v === 0) return 'unknown';
  if (v < 90) return 'critical';
  if (v < 95) return 'warning';
  return 'normal';
}

export function getTempStatus(v: number | null): StatusLevel {
  if (v == null || v === 0) return 'unknown';
  if (v < 35 || v > 39.5) return 'critical';
  if (v > 37.5) return 'warning';
  return 'normal';
}

export function getGForceStatus(v: number | null, fall: boolean): StatusLevel {
  if (fall) return 'critical';
  if (v == null) return 'unknown';
  if (v > 2.0) return 'warning';
  return 'normal';
}

export function getStatusLabel(status: StatusLevel): string {
  switch (status) {
    case 'normal': return 'NORMAL';
    case 'warning': return 'WARNING';
    case 'critical': return 'CRITICAL';
    default: return 'NO DATA';
  }
}

export function getCardClass(status: StatusLevel): string {
  switch (status) {
    case 'normal': return 'cp-card cp-card-normal';
    case 'warning': return 'cp-card cp-card-warning';
    case 'critical': return 'cp-card cp-card-critical';
    default: return 'cp-card';
  }
}

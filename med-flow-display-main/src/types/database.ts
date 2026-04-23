export interface Vital {
  id: number;
  device_id: string;
  heart_rate: number | null;
  hr_valid: boolean | null;
  spo2: number | null;
  spo2_valid: boolean | null;
  temp_body: number | null;
  temp_ambient: number | null;
  humidity: number | null;
  g_force: number | null;
  roll: number | null;
  pitch: number | null;
  gyro_x: number | null;
  gyro_y: number | null;
  gyro_z: number | null;
  fall_detected: boolean | null;
  recorded_at: string | null;
}

export interface FallAlert {
  id: number;
  device_id: string;
  patient_name?: string | null;
  g_force: number | null;
  roll: number | null;
  pitch: number | null;
  resolved: boolean | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string | null;
}

export interface Profile {
  id: string;
  role: 'patient' | 'doctor';
  full_name: string | null;
  email: string | null;
  blood_type?: string | null;
  emergency_contact?: string | null;
  assigned_device?: string | null;
  specialization?: string | null;
  license_no?: string | null;
  hospital?: string | null;
  created_at?: string | null;
}

export interface Device {
  id: string;
  device_id: string;
  patient_name: string | null;
  is_online: boolean | null;
  last_seen: string | null;
  firmware_ver: string | null;
}

export type StatusLevel = 'normal' | 'warning' | 'critical' | 'unknown';

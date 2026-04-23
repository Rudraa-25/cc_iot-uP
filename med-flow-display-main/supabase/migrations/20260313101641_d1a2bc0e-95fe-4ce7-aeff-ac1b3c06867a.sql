CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS devices (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  device_id   TEXT UNIQUE NOT NULL,
  patient_name TEXT,
  patient_id  UUID REFERENCES auth.users(id),
  firmware_ver TEXT DEFAULT '3.0.0',
  is_online   BOOLEAN DEFAULT FALSE,
  last_seen   TIMESTAMPTZ DEFAULT NOW(),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vitals (
  id           BIGSERIAL PRIMARY KEY,
  device_id    TEXT NOT NULL REFERENCES devices(device_id),
  heart_rate   INTEGER,
  hr_valid     BOOLEAN DEFAULT FALSE,
  spo2         INTEGER,
  spo2_valid   BOOLEAN DEFAULT FALSE,
  temp_body    NUMERIC(5,2),
  temp_ambient NUMERIC(5,2),
  humidity     NUMERIC(5,1),
  g_force      NUMERIC(6,3),
  roll         NUMERIC(7,2),
  pitch        NUMERIC(7,2),
  gyro_x       NUMERIC(7,2),
  gyro_y       NUMERIC(7,2),
  gyro_z       NUMERIC(7,2),
  fall_detected BOOLEAN DEFAULT FALSE,
  recorded_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fall_alerts (
  id          BIGSERIAL PRIMARY KEY,
  device_id   TEXT NOT NULL REFERENCES devices(device_id),
  g_force     NUMERIC(6,3),
  roll        NUMERIC(7,2),
  pitch       NUMERIC(7,2),
  resolved    BOOLEAN DEFAULT FALSE,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
  id                UUID REFERENCES auth.users(id) PRIMARY KEY,
  role              TEXT CHECK (role IN ('patient','doctor')) NOT NULL,
  full_name         TEXT,
  email             TEXT,
  blood_type        TEXT,
  emergency_contact TEXT,
  assigned_device   TEXT REFERENCES devices(device_id),
  specialization    TEXT,
  license_no        TEXT,
  hospital          TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS doctor_notes (
  id         BIGSERIAL PRIMARY KEY,
  patient_id UUID REFERENCES auth.users(id),
  doctor_id  UUID REFERENCES auth.users(id),
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO devices (device_id, patient_name)
VALUES ('esp32-chainpulse-001', 'Patient One')
ON CONFLICT (device_id) DO NOTHING;

ALTER TABLE devices      ENABLE ROW LEVEL SECURITY;
ALTER TABLE vitals       ENABLE ROW LEVEL SECURITY;
ALTER TABLE fall_alerts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon insert vitals"
  ON vitals FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "anon read vitals"
  ON vitals FOR SELECT USING (TRUE);
CREATE POLICY "anon insert alerts"
  ON fall_alerts FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "auth read alerts"
  ON fall_alerts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth update alerts"
  ON fall_alerts FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "anon read devices"
  ON devices FOR SELECT USING (TRUE);
CREATE POLICY "anon update devices"
  ON devices FOR UPDATE USING (TRUE);
CREATE POLICY "own profile"
  ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "doctors read all profiles"
  ON profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'doctor')
  );
CREATE POLICY "doctor notes access"
  ON doctor_notes FOR ALL USING (auth.role() = 'authenticated');

ALTER PUBLICATION supabase_realtime ADD TABLE vitals;
ALTER PUBLICATION supabase_realtime ADD TABLE fall_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE devices;

CREATE OR REPLACE VIEW latest_vitals AS
SELECT DISTINCT ON (device_id) * FROM vitals
ORDER BY device_id, recorded_at DESC;

CREATE OR REPLACE VIEW active_alerts AS
SELECT fa.*, d.patient_name
FROM fall_alerts fa
JOIN devices d ON fa.device_id = d.device_id
WHERE fa.resolved = FALSE
ORDER BY fa.created_at DESC;
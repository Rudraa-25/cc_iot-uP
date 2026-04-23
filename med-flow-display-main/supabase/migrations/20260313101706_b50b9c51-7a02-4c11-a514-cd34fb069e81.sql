DROP VIEW IF EXISTS latest_vitals;
DROP VIEW IF EXISTS active_alerts;

CREATE OR REPLACE VIEW latest_vitals WITH (security_invoker = on) AS
SELECT DISTINCT ON (device_id) * FROM vitals
ORDER BY device_id, recorded_at DESC;

CREATE OR REPLACE VIEW active_alerts WITH (security_invoker = on) AS
SELECT fa.*, d.patient_name
FROM fall_alerts fa
JOIN devices d ON fa.device_id = d.device_id
WHERE fa.resolved = FALSE
ORDER BY fa.created_at DESC;
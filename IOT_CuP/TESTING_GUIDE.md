# Testing & Monitoring Guide

## Build Verification

### 1. Build Check
```bash
# Check for build errors without uploading
platformio run -e esp32-c3-devmodule --target check
```

Expected output:
```
Checking ESP32-C3 Super Mini firmware
Processing esp32-c3-devmodule
Compiling .pio/... (successful builds use minimal output)
[PASS] No errors detected
```

### 2. Build Size
```bash
platformio run -e esp32-c3-devmodule
```

Check output for:
```
RAM:   [===   ]  32.1% (used by 52484 bytes from 163840 bytes)
Flash: [==    ]  18.5% (used by 730012 bytes from 3932160 bytes)
```

**Target benchmarks** (ESP32-C3 400KB SRAM):
- RAM usage: < 50% (~200KB available)
- Flash usage: < 40% (~1.5MB available)

---

## Runtime Testing

### Serial Connection

```bash
# Open serial monitor
platformio device monitor -e esp32-c3-devmodule --baud 115200

# Or use external tool
# Windows: putty, TeraTerm
# Linux/Mac: minicom, screen
```

### Expected Boot Sequence

```
╔══════════════════════════════════════╗
║  ESP32-C3 SUPER MINI HEALTH MONITOR  ║
║         Firmware v1.0.0              ║
╚══════════════════════════════════════╝

[INIT] Configuring I2C...

========================================
I2C DEVICE SCAN
========================================
I2C device found at address 0x3C      ← SSD1306
I2C device found at address 0x57      ← MAX30102
I2C device found at address 0x68      ← MPU6050
Total devices: 3
========================================

[OK] SSD1306 OLED initialized
[OK] MAX30102 initialized
[OK] MPU6050 initialized
[OK] DS18B20 initialized
[OK] DHT22 initialized
[OK] Buzzer initialized on GPIO10

========== SENSOR STATUS ==========
MAX30102:  OK
MPU6050:   OK
DS18B20:   OK
DHT22:     OK
===================================

✓ Setup complete. Starting main loop...
```

### JSON Output Verification

The firmware sends JSON every 2 seconds. Check the format:

```
{"timestamp_ms":2045,"heart_rate":78,"spo2":98,"accel_x":0.15,"accel_y":-0.23,"accel_z":9.81,"fall_detected":false,"body_temp_c":36.5,"humidity":62.3,"ambient_temp_c":23.2,"alert_active":false}

{"timestamp_ms":4056,"heart_rate":79,"spo2":97,"accel_x":0.12,"accel_y":-0.21,"accel_z":9.82,"fall_detected":false,"body_temp_c":36.5,"humidity":62.4,"ambient_temp_c":23.2,"alert_active":false}
```

**Parse JSON for validation:**
```bash
# Using jq (Linux/Mac) or parse in Python
cat /dev/ttyUSB0 | grep "timestamp_ms" | jq '.'
```

Or use Python script:
```python
import json
import serial

ser = serial.Serial('/dev/ttyUSB0', 115200, timeout=1)

while True:
    line = ser.readline().decode('utf-8').strip()
    if line.startswith('{'):
        try:
            data = json.loads(line)
            print(f"HR: {data.get('heart_rate')} | "
                  f"SpO2: {data.get('spo2')}% | "
                  f"Temp: {data.get('body_temp_c')}°C | "
                  f"Alert: {data.get('alert_active')}")
        except json.JSONDecodeError:
            print(f"Invalid JSON: {line}")
```

---

## Sensor Testing

### 1. MAX30102 (Heart Rate/SpO2)

**Test procedure:**
1. Place index finger on sensor
2. Apply gentle pressure (don't squeeze)
3. Keep still for 10 seconds
4. Monitor serial output

**Expected values:**
- Heart rate: 60-100 bpm (varies by health)
- SpO2: 95-100% (normal oxygen saturation)
- LED indicator: Red LED should glow when detecting signal

**Troubleshooting:**
- No LED glow: Check power, verify I2C address 0x57
- Reading 0: Ensure finger is placed correctly
- Fluctuating: Normal during initial acquisition

### 2. MPU6050 (Accelerometer)

**Test procedure:**
1. Keep device still
2. Check Z-axis = ~9.81 m/s² (gravity)
3. Tilt device 45°, X-axis should change
4. Detect motion from serial output

**Expected values:**
- Rest (still):
  ```
  accel_x: -0.1 to 0.1
  accel_y: -0.1 to 0.1
  accel_z: 9.7 to 10.0
  ```
- Moving:
  ```
  Any axis can change from -16 to +16 G
  ```

**Fall detection test:**
- **Safe test**: Gently drop device ~1 meter onto soft surface
- Watch for `"fall_detected": true` in JSON
- Buzzer should sound (if enabled)

### 3. DS18B20 (Temperature)

**Test procedure:**
1. Keep at room temperature
2. Check body_temp_c in JSON output
3. Hold finger on sensor
4. Temperature should gradually rise

**Expected values:**
- Room temperature: 20-25°C
- Skin contact: 35-37°C (normal body temp)
- Change rate: ~0.5°C per 10 seconds

**Troubleshooting:**
- Fixed reading: Check 1-Wire pull-up resistor
- No reading: Verify GPIO2 connection, check DQ pin

### 4. DHT22 (Humidity)

**Test procedure:**
1. Power on, wait 5 seconds
2. Check humidity % and ambient_temp_c
3. Breath on sensor
4. Humidity should increase

**Expected values:**
- Humidity: 30-80% (indoor)
- Temperature: ±2°C accuracy
- Response time: 2-5 seconds after stimulus

**Troubleshooting:**
- Timeout errors: DHT22 pin needs 10k pull-up
- Slow response: Normal DHT22 behavior
- No data: Check GPIO3 connection

### 5. SSD1306 (Display)

**Test procedure:**
1. Power on device
2. OLED should show header "=== HEALTH MONITOR ==="
3. Verify formatted data displays correctly
4. Check contrast and brightness

**Display format:**
```
=== HEALTH MONITOR ===
HR:78bpm  SpO2:98%
Body Temp: 36.5C
Humidity: 62%
Accel: 9.8G
Status: OK
```

**Troubleshooting:**
- No display: Check I2C address 0x3C
- Garbage pixels: I2C corruption (add capacitor to SDA/SCL)
- Dim display: Check I2C voltage levels

### 6. Buzzer

**Test procedure:**
1. Check GPIO10 connection
2. Trigger alert condition (move device quickly)
3. Buzzer should produce audio
4. Serial should show `"alert_active": true`

**Alert patterns:**
- Double beep: Alert triggered
- Silent: Normal operation

**Troubleshooting:**
- No sound: Check GPIO10 voltage, verify polarity
- Continuous: Check buzzer_stop() function

---

## Performance Profiling

### Loop Frequency
```cpp
// Add this to main loop for profiling
static uint32_t last_print = 0;
static uint32_t loop_count = 0;
loop_count++;

if (millis() - last_print >= 1000) {
    Serial.print("Loop frequency: ");
    Serial.print(loop_count);
    Serial.println(" Hz");
    loop_count = 0;
    last_print = millis();
}
```

Expected output: **~1000 Hz** or higher

### Memory Monitoring

Enable heap monitoring:
```cpp
Serial.print("Free heap: ");
Serial.print(ESP.getFreeHeap());
Serial.println(" bytes");
```

Expected: **>120KB** available after startup

### I2C Traffic

View I2C communications (with logic analyzer):
- SDA/SCL frequency: 100-400 kHz
- Max30102: ~10ms per sample
- MPU6050: ~5ms per sample
- DS18B20: ~100ms per sample

---

## Stress Testing

### 1. Extended Runtime
```bash
# Monitor for 24 hours
# Check for:
# - Memory leaks (free heap should stabilize)
# - Sensor drift (readings should be consistent)
# - No crashes or reboots
```

**Commands to monitor:**
```python
import serial
import time
import json

ser = serial.Serial('/dev/ttyUSB0', 115200)
start_time = time.time()
hr_values = []

while (time.time() - start_time) < 86400:  # 24 hours
    line = ser.readline().decode().strip()
    if line.startswith('{'):
        data = json.loads(line)
        hr_values.append(data.get('heart_rate', 0))
        
        if len(hr_values) % 1000 == 0:  # Every 500 seconds
            elapsed = (time.time() - start_time) / 3600
            avg_hr = sum(hr_values[-100:]) / 100
            print(f"[{elapsed:.1f}h] Avg HR: {avg_hr:.0f} bpm")
```

### 2. Thermal Stress
- Monitor temperature rise over time
- Check if sensors have thermal drift
- Verify buzzer doesn't overheat

### 3. Power Cycling
- Disconnect USB
- Reconnect after 5 seconds
- Check device resumes normally
- Verify no sensor corruption

---

## Debugging

### Enable Verbose Output
```bash
# Add to platformio.ini
build_flags = 
    -DCORE_DEBUG_LEVEL=3  # Enable debug output
    -DDEBUG=1
```

### Common Issues & Solutions

| Symptom | Cause | Solution |
|---------|-------|----------|
| Device crashes every 30s | Stack overflow | Reduce sensor buffer size |
| JSON incomplete | Heap fragmentation | Reduce JSON size or restart |
| I2C bus hangs | Sensor lockup | Add timeout to Wire calls |
| OLED flickers | Refresh rate too high | Increase update interval |
| Sensors drift | Calibration needed | Verify operating conditions |

### Serial Protocol Analysis

Capture data for analysis:
```bash
# Linux/Mac
screen /dev/ttyUSB0 115200 -L  # Logs to screenlog.0

# Windows (PowerShell)
$port = New-Object System.IO.Ports.SerialPort COM3, 115200
(Get-Content -Wait) | % { $port.WriteLine($_) }
```


---

## Factory Testing Checklist

### Pre-deployment
- [ ] All 5 sensors responding on I2C
- [ ] JSON output valid and complete
- [ ] OLED displaying all fields
- [ ] Buzzer produces audio at alert
- [ ] Fall detection triggers on device drop
- [ ] Temperature reads within ±2°C of reference
- [ ] Serial data stable for 5 minutes
- [ ] No crashes or reboots
- [ ] Memory usage <50%
- [ ] Loop frequency >900 Hz

### Environmental
- [ ] Works at 5-40°C temperature range
- [ ] Works at 30-80% humidity range
- [ ] No interference from nearby RF sources

---

## Production Deployment

### Do's
✅ Use 2+ second sensor intervals (defined)
✅ Enable I2C pull-ups (4.7k Ω)
✅ Add 100µF capacitors on power rails
✅ Use USB hub with ≥500mA per port
✅ Log JSON output to cloud/database
✅ Monitor free heap periodically

### Don'ts
❌ Use delay() in main loop
❌ Remove pull-up resistors
❌ Connect 5V to GPIO pins directly
❌ Run WiFi simultaneously (memory contention)
❌ Trust heart rate without medical validation
❌ Ignore I2C scan errors

---

## Example Data Collection

Save data to file via serial:
```bash
# Linux
cat /dev/ttyUSB0 | tee sensor_data.jsonl &

# Windows PowerShell
$port = New-Object System.IO.Ports.SerialPort "COM3", 115200, None, 8, One
$port.Open()
while($true) { $port.WriteLine( (Read-Host) ) }
```

Process collected data:
```python
import json
import pandas as pd

data_points = []
with open('sensor_data.jsonl') as f:
    for line in f:
        if line.strip().startswith('{'):
            data_points.append(json.loads(line))

df = pd.DataFrame(data_points)
print(df.describe())  # Statistics

# Export to CSV
df.to_csv('sensor_export.csv', index=False)
```

# Quick Start Guide

## 5-Minute Setup

### 1. Install PlatformIO
```bash
# Install via VS Code extension
# OR via pip
pip install platformio
```

### 2. Clone Project
```bash
cd c:\Users\Hemangi\OneDrive\Desktop\IOT_C\ uP
```

### 3. Connect Board
- Plug ESP32-C3 via USB to computer
- Note the COM port (Device Manager → Ports)

### 4. Edit Configuration
Open `platformio.ini`:
```ini
monitor_port = COM3  # Change to your port
upload_speed = 460800
```

### 5. Build & Upload
```bash
platformio run -e esp32-c3-devmodule --target upload
```

### 6. Monitor Output
```bash
platformio device monitor -e esp32-c3-devmodule --baud 115200
```

Expected: I2C scan results and sensor initialization messages

---

## File Structure

```
esp32-c3-health-monitor/
├── platformio.ini           ← Configuration
├── README.md                ← Full documentation
├── HARDWARE_SETUP.md        ← Wiring guide
├── TESTING_GUIDE.md         ← Test procedures
├── QUICK_START.md           ← This file
│
├── src/
│   └── main.cpp             ← Main firmware (1000+ lines)
│
├── include/
│   ├── config.h             ← All #defines
│   ├── sensors.h            ← Sensor data structures
│   └── utils.h              ← Function declarations
│
└── lib/
    └── (libraries auto-installed by PlatformIO)
```

---

## Pin Quick Reference

```
GPIO Assignments:
├── I2C (Shared on 4.7k pull-up)
│   ├── GPIO8  = SDA (all I2C sensors)
│   └── GPIO9  = SCL (all I2C sensors)
│
├── 1-Wire
│   └── GPIO2  = DS18B20 (4.7k pull-up to 3.3V)
│
├── Digital
│   ├── GPIO3  = DHT22 (10k pull-up to 3.3V)
│   └── GPIO10 = Buzzer
│
├── Serial (USB)
│   ├── GPIO6  = TX (auto)
│   └── GPIO7  = RX (auto)
│
└── I2C Addresses:
    ├── 0x3C   = SSD1306 OLED
    ├── 0x57   = MAX30102
    └── 0x68   = MPU6050
```

---

## Sensor Troubleshooting

### MAX30102 Not Detected
```
I2C device found at address 0x3C    ← OLED OK
I2C device found at address 0x68    ← MPU OK
(missing 0x57)
```
**Fixes:**
- Check 3.3V power to sensor
- Verify SDA/SCL wiring
- Try another I2C address (datasheet)

### DHT22 Timeout
```
[FAIL] DHT22 not responding on GPIO3
```
**Fixes:**
- Check GPIO3 physical connection
- Verify 10k Ω pull-up resistor is present
- Try using GPIO4 instead (edit config.h)

### OLED Shows Garbage
```
═╬╬╬╬╬╬╬╬╦
╦╦═╬═╬═╬═╬ (random symbols)
```
**Fixes:**
- Verify I2C address is 0x3C (edit config.h)
- Check SDA/SCL polarity
- Add 100nF capacitor to I2C lines

### Frequent Reboots
```
(lots of boot messages repeating)
```
**Fixes:**
- Check UART_RX (GPIO7) connection
- Verify USB cable supports data
- Try reducing baud rate to 9600

---

## JSON Output Format

### Successful Reading
```json
{
  "timestamp_ms": 45230,
  "heart_rate": 78,
  "spo2": 98,
  "accel_x": 0.2,
  "accel_y": 0.3,
  "accel_z": 9.8,
  "fall_detected": false,
  "body_temp_c": 36.8,
  "humidity": 55.2,
  "ambient_temp_c": 24.5,
  "alert_active": false
}
```

### Alert Condition
```json
{
  "timestamp_ms": 125430,
  "heart_rate": 145,
  "spo2": 92,
  "alert_active": true,
  "alert_reason": "High Heart Rate"
}
```

**Alert triggers:**
- Heart rate <60 or >100 bpm
- SpO2 <95%
- Fall detected
- Body temp >38°C
- Humidity >80%

---

## Common Commands

```bash
# Build check
platformio check -e esp32-c3-devmodule

# Build without uploading
platformio run -e esp32-c3-devmodule

# Build and upload
platformio run -e esp32-c3-devmodule --target upload

# Monitor with output capture
platformio device monitor --baud 115200 -f esp32_exception_decoder

# Clean project
platformio run -e esp32-c3-devmodule --target clean

# Install dependencies
platformio lib install

# List detected boards
platformio boards | grep esp32-c3
```

---

## Feature Flags (config.h)

Turn features on/off quickly:

```cpp
#define ENABLE_OLED 1          // Disable to save ~30KB RAM
#define ENABLE_BUZZER 1        // Disable to save GPIO10
#define ENABLE_SERIAL_JSON 1   // Disable to save bandwidth
#define ENABLE_I2C_SCAN 1      // Disable to skip scan
```

**Memory impact of disabling:**
- No OLED: +30KB free heap
- No buzzer: ~2KB code
- No JSON: ~5KB code

---

## Tuning Parameters

Edit in `config.h` to adjust behavior:

```cpp
// Faster sampling (smaller = faster)
#define SAMPLE_INTERVAL_MS 1000      // Default: 2000ms

// Lower alert thresholds (more sensitive)
#define HEART_RATE_NORMAL_MAX 95     // Default: 100

// Sensitivity of fall detection (larger = less sensitive)
#define FALL_DETECTION_THRESHOLD 2.5 // Default: 3.0
```

---

## Memory Optimization Tricks

If running out of memory:

1. **Reduce JSON buffer**
   ```cpp
   #define JSON_BUFFER_SIZE 128  // From 256
   ```

2. **Reduce sample rate**
   ```cpp
   #define SAMPLE_INTERVAL_MS 5000  // From 2000ms
   ```

3. **Disable OLED**
   ```cpp
   #define ENABLE_OLED 0  // Saves 30KB+
   ```

4. **Simplify display**
   ```cpp
   // Remove unused fields from display_update()
   ```

---

## Next Steps

1. ✅ **Build and upload** - Test on physical board
2. ✅ **Verify sensors** - Check I2C scan output
3. ✅ **Monitor data** - Open serial and watch JSON
4. ✅ **Test alerts** - Trigger abnormal conditions
5. ✅ **Measure performance** - Use commands above
6. 📝 **Customize** - Modify thresholds in config.h
7. 🚀 **Deploy** - Export firmware for production

---

## Additional Resources

- **Datasheets**:
  - MAX30102: https://datasheets.maximintegrated.com/en/ds/MAX30102.pdf
  - MPU6050: https://www.invensense.com/wp-content/uploads/2015/02/MPU-6000-Datasheet1.pdf
  - SSD1306: https://cdn-shop.adafruit.com/datasheets/SSD1306.pdf
  - DS18B20: https://datasheets.maximintegrated.com/en/ds/DS18B20.pdf
  - DHT22: https://www.sparkfun.com/datasheets/Sensors/Temperature/DHT22.pdf

- **Libraries**:
  - PlatformIO Registry: https://platformio.org/lib
  - Arduino Documentation: https://docs.arduino.cc/

- **Community**:
  - PlatformIO Forum: https://community.platformio.org/
  - Arduino Forum: https://forum.arduino.cc/
  - ESP32 Forum: https://www.esp32.com/

---

## Support

**Debug Mode**:
```bash
# Rebuild with debug symbols
platformio run -e esp32-c3-devmodule --target clean
platformio run -e esp32-c3-devmodule -vv  # Verbose output
```

**Serial Analysis**:
```bash
# Save 1000 lines of output to file
(for i in {1..1000}; do timeout 20 platformio device monitor --baud 115200; done) > debug_log.txt
```

**Check Logs**:
```bash
cat debug_log.txt | grep ERROR
cat debug_log.txt | grep "0x" | sort | uniq
```

---

## Version History

- **v1.0.0** - Initial release
  - 5 sensor integration
  - Non-blocking architecture
  - JSON serial output
  - Memory optimized for 400KB SRAM

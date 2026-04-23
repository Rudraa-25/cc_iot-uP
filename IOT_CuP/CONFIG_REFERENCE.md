# Configuration Reference

This document provides detailed explanation of all configuration options.

## config.h Parameters

### I2C & Pin Configuration

```cpp
// I2C Bus Configuration (TwoWire library)
#define PIN_I2C_SDA 8               // GPIO8 for SDA line
#define PIN_I2C_SCL 9               // GPIO9 for SCL line
#define I2C_FREQ 400000             // 400 kHz I2C frequency

// Other GPIO pins
#define PIN_DS18B20 2               // 1-Wire temperature sensor
#define PIN_DHT22 3                 // Digital humidity sensor
#define PIN_BUZZER 10               // PWM buzzer output
```

**Note**: SDA and SCL must have external 4.7k pull-ups to 3.3V.

### Sensor I2C Addresses

```cpp
#define MAX30102_ADDRESS 0x57       // Heart rate/SpO2 sensor
#define MPU6050_ADDRESS 0x68        // 6-axis IMU
#define OLED_ADDRESS 0x3C           // 0.91" 128x32 OLED display
```

To verify addresses:
```cpp
// In serial output during I2C scan
I2C device found at address 0x[HEX]
```

### Sampling Intervals

```cpp
#define SAMPLE_INTERVAL_MS 2000         // Main sensor polling rate (2 seconds)
#define DHT_SAMPLE_INTERVAL_MS 5000     // DHT22 minimum read interval (5 seconds)
#define OLED_UPDATE_INTERVAL_MS 1000    // Display refresh rate (1 second)
```

**Rationale:**
- Main interval (2s) supports real-time monitoring without excessive I2C traffic
- DHT22 needs 2+ second delays between measurements (sensor limitation)
- OLED update every 1s provides smooth visual feedback

**Trade-offs:**
- Smaller interval = more responsive but higher power consumption
- Larger interval = lower power but delayed data updates

### Alert Thresholds

```cpp
#define FALL_DETECTION_THRESHOLD 3.0        // Acceleration magnitude (G units)
#define HEART_RATE_NORMAL_MIN 60            // Minimum normal heart rate (bpm)
#define HEART_RATE_NORMAL_MAX 100           // Maximum normal heart rate (bpm)
#define SPO2_NORMAL_MIN 95                  // Minimum normal oxygen saturation (%)
#define TEMP_WARNING_THRESHOLD 38.0         // Body temperature alert level (°C)
#define HUMIDITY_WARNING_THRESHOLD 80       // Humidity alert level (%)
```

**Customization examples:**

For athletes (higher heart rate):
```cpp
#define HEART_RATE_NORMAL_MAX 120  // Normal for trained individuals
```

For elderly care (lower threshold):
```cpp
#define TEMP_WARNING_THRESHOLD 37.5  // Lower fever threshold
```

For infant monitoring:
```cpp
#define HEART_RATE_NORMAL_MIN 100    // Infants: 100-160 bpm
#define HEART_RATE_NORMAL_MAX 160
```

### Memory Configuration

```cpp
#define MAX_SENSOR_BUFFER 10        // History buffer size (not currently used)
#define JSON_BUFFER_SIZE 256        // StaticJsonDocument capacity
```

**JSON buffer sizing:**
- Minimum: 128 bytes (with fewer fields)
- Default: 256 bytes (all fields included)
- Maximum: 512 bytes (not recommended for ESP32-C3)

Check serialized JSON size:
```cpp
serializeJson(doc, Serial);
Serial.println(measureJson(doc));  // Prints byte count
```

### Feature Flags

```cpp
#define ENABLE_OLED 1               // Enable SSD1306 display support
#define ENABLE_BUZZER 1             // Enable GPIO10 buzzer output
#define ENABLE_SERIAL_JSON 1        // Enable JSON serial transmission
#define ENABLE_I2C_SCAN 1           // Enable I2C bus scanning at startup
```

**Memory impact table:**

| Feature | Code Size | RAM Impact | Notes |
|---------|-----------|------------|-------|
| OLED | +25KB | +30KB | Display memory buffer |
| Buzzer | +2KB | <1KB | GPIO control only |
| Serial JSON | +5KB | +256B | StaticJsonDocument |
| I2C Scan | +3KB | +100B | One-time startup |

---

## platformio.ini Reference

### Build Configuration

```ini
[env:esp32-c3-devmodule]
platform = espressif32          # ESP32 platform
board = esp32-c3-devmodule      # Board type
framework = arduino             # Arduino framework for ESP32

monitor_speed = 115200          # Serial monitor baud rate
upload_speed = 460800           # USB upload speed (faster)
monitor_port = COM3             # Serial port (change as needed)
```

### Build Flags

```ini
build_flags = 
    -DBOARD_HAS_PSRAM=0         # No external PSRAM
    -DCORE_DEBUG_LEVEL=0        # Disable core debug messages
    -O2                         # Optimization level 2
    -Wall                       # Enable warnings
```

Optimization levels:
- `-O0`: No optimization (debug only, ~2x firmware size)
- `-O1`: Minimal optimization
- `-O2`: Balanced (default, recommended)
- `-O3`: Maximum optimization (may introduce bugs)
- `-Os`: Size optimization (smallest firmware)

Use `-Os` if approaching 4MB flash limit:
```ini
build_flags = -Os
```

### Library Dependencies

```ini
lib_deps =
    adafruit/Adafruit SSD1306@^2.5.7
    adafruit/Adafruit GFX Library@^1.11.9
    adafruit/Adafruit MAX30105 Library@^1.2.2
    adafruit/Adafruit MPU6050@^2.2.5
    adafruit/Adafruit BusIO@^1.14.1
    paulstoffregen/OneWire@^2.3.7
    beegee-tokyo/DHT sensor library for ESPx@^1.18
    jrowberg/MPU6050@^0.12.0
```

**Alternative library options:**

For MAX30102:
```ini
sparkfun/SparkFun MAX30102 Particle Sensor Library
```

For DHT22:
```ini
adafruit/DHT sensor library@^1.4.4
```

### Serial Monitoring

```ini
monitor_filters = esp32_exception_decoder
```

This automatically decodes stack traces from crashes.

---

## Adjusting for Different Scenarios

### Scenario A: Power-Constrained Wearable

```cpp
// In config.h
#define SAMPLE_INTERVAL_MS 5000         // Sample every 5 seconds
#define OLED_UPDATE_INTERVAL_MS 5000    // Update display less often
#define ENABLE_I2C_SCAN 0               // Skip scan at startup
```

**Expected power:** ~60mA average

### Scenario B: Real-time Monitoring (High Responsiveness)

```cpp
#define SAMPLE_INTERVAL_MS 500          // Sample every 500ms
#define OLED_UPDATE_INTERVAL_MS 500     // Smooth display
#define ENABLE_SERIAL_JSON 1            // Full JSON output
```

**Expected power:** ~150mA average

### Scenario C: Clinical (Strict Accuracy)

```cpp
// Different thresholds
#define HEART_RATE_NORMAL_MIN 50        // Wider range
#define HEART_RATE_NORMAL_MAX 120
#define SPO2_NORMAL_MIN 92              // Lower threshold
#define TEMP_WARNING_THRESHOLD 37.8     // Stricter fever detection
```

### Scenario D: Minimalist (Memory Constrained)

```ini
; In platformio.ini
build_flags = 
    -O2
    -Wl,--gc-sections          ; Remove unused sections
    -ffunction-sections
```

```cpp
; In config.h
#define ENABLE_OLED 0                   ; -30KB RAM
#define ENABLE_I2C_SCAN 0               ; Skip unnecessary init
#define JSON_BUFFER_SIZE 128            ; Smaller buffer
```

---

## Debugging Configuration

### Verbose Serial Output

```ini
; platformio.ini
build_flags = 
    -DCORE_DEBUG_LEVEL=3        ; Maximum debug output
    -DDEBUG=1
```

This enables:
- WiFi/BLE debug messages (if enabled)
- Memory allocation logs
- I2C transaction details

### Memory Profiling

Add to main loop:
```cpp
if (millis() % 10000 == 0) {  // Every 10 seconds
    Serial.print("Free heap: ");
    Serial.print(esp_get_free_heap_size());
    Serial.print(" bytes | Min: ");
    Serial.println(esp_get_minimum_free_heap_size());
}
```

Monitor heap decline:
- Stable = No memory leak ✓
- Decreasing = Memory leak ✗

### Timing Analysis

```cpp
static uint32_t loop_count = 0;
static uint32_t last_time = 0;

loop_count++;
if (millis() - last_time >= 1000) {
    Serial.print("Loop rate: ");
    Serial.print(loop_count);
    Serial.println(" Hz");
    loop_count = 0;
    last_time = millis();
}
```

Expected: >900 Hz

---

## Advanced Customization

### Custom I2C Multiplexing

If needing more I2C sensors:
```cpp
// Use software I2C library
#define SDA_PORT PORTB
#define SDA_PIN 4  // Arbitrary GPIO
#define SCL_PORT PORTB
#define SCL_PIN 5  // Arbitrary GPIO

SoftwareWire I2C_Alt(SDA_PIN, SCL_PIN);
```

### Custom Fall Detection

```cpp
// Replace simple magnitude check with ML-based detection
bool detect_fall_advanced(const SensorData& data) {
    // Example: Jerk calculation (second derivative)
    float accel_mag = calculate_acceleration_magnitude(...);
    static float prev_mag = 0;
    float jerk = accel_mag - prev_mag;
    prev_mag = accel_mag;
    
    // Detect both high jerk and free fall
    return (jerk > 5.0) || (accel_mag < 0.5);
}
```

### Custom Alert Handling

```cpp
// Replace buzzer with LED or other actuator
void custom_alert(bool active) {
    if (active) {
        digitalWrite(LED_PIN, HIGH);  // LED on
    } else {
        digitalWrite(LED_PIN, LOW);   // LED off
    }
}
```

---

## Validation Checklist

Before deployment, verify:

- [ ] All thresholds match clinical/user requirements
- [ ] Memory flags match hardware (PSRAM enabled if available)
- [ ] Library versions are compatible
- [ ] Serial port correct for target system
- [ ] All feature flags intentional
- [ ] Build succeeds with no warnings
- [ ] Upload completes without errors
- [ ] Sensors initialize in correct order

---

## Version Notes

**Arduino Core 2.0.7+**
- Supports ESP32-C3 Super Mini
- I2C behavior unchanged
- Memory model improved

**PlatformIO 6.0+**
- Automatic dependency resolution
- Better board detection
- Improved upload reliability

For issues with specific versions, lock in platformio.ini:
```ini
platform = espressif32@6.1.0
framework = arduino@2.0.7
```

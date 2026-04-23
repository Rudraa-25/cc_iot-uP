#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_GFX.h>
#include <Adafruit_MAX30105.h>
#include <Adafruit_MPU6050.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <DHT.h>
#include <StaticJsonDocument.h>

#include "config.h"
#include "sensors.h"
#include "utils.h"

// ==================== GLOBAL OBJECTS ====================

// I2C Wire (using default pins, will override in setup)
TwoWire I2C = TwoWire(0);

// Sensor objects
Adafruit_SSD1306 display(128, 32, &I2C, -1);
Adafruit_MAX30105 particleSensor;
Adafruit_MPU6050 mpu;
OneWire oneWire(PIN_DS18B20);
DallasTemperature sensors(&oneWire);
DHT dht(PIN_DHT22, DHT22);

// Global sensor data
SensorData gSensorData = {0};

// Timing variables for non-blocking operations
uint32_t nextSampleTime_ms = 0;
uint32_t nextDHTTime_ms = 0;
uint32_t nextDisplayTime_ms = 0;
uint32_t nextSerialTime_ms = 0;

// ==================== I2C SCANNING ====================

void i2c_scan_and_report() {
    Serial.println("\n========================================");
    Serial.println("I2C DEVICE SCAN");
    Serial.println("========================================");
    
    byte error, address;
    int nDevices = 0;
    
    for (address = 1; address < 127; address++) {
        I2C.beginTransmission(address);
        error = I2C.endTransmission();
        
        if (error == 0) {
            Serial.print("I2C device found at address 0x");
            if (address < 16) Serial.print("0");
            Serial.println(address, HEX);
            nDevices++;
        }
    }
    
    if (nDevices == 0) {
        Serial.println("No I2C devices found");
    } else {
        Serial.print("Total devices: ");
        Serial.println(nDevices);
    }
    
    Serial.println("========================================\n");
}

// ==================== SENSOR INITIALIZATION ====================

void sensors_init(SensorData& sensor_data) {
    Serial.println("\n========== SENSOR INITIALIZATION ==========");
    
    // Initialize MAX30102 (Heart Rate & SpO2)
    if (particleSensor.begin(I2C, I2C_FREQ)) {
        Serial.println("[OK] MAX30102 initialized");
        particleSensor.setup();
        particleSensor.setPulseAmplitudeRed(0x0A);
        particleSensor.setPulseAmplitudeIR(0x0A);
        sensor_data.max30102.available = true;
    } else {
        Serial.println("[FAIL] MAX30102 not found at 0x57");
        sensor_data.max30102.available = false;
    }
    
    // Initialize MPU6050 (Accelerometer/Gyroscope)
    if (mpu.begin(MPU6050_ADDRESS, &I2C, I2C_FREQ)) {
        Serial.println("[OK] MPU6050 initialized");
        mpu.setAccelerometerRange(MPU6050_RANGE_16_G);
        mpu.setGyroRange(MPU6050_RANGE_2000_DEG);
        mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
        sensor_data.mpu6050.available = true;
    } else {
        Serial.println("[FAIL] MPU6050 not found at 0x68");
        sensor_data.mpu6050.available = false;
    }
    
    // Initialize DS18B20 (Body Temperature)
    sensors.begin();
    if (sensors.getDeviceCount() > 0) {
        Serial.println("[OK] DS18B20 initialized");
        sensors.setResolution(9); // 9-bit resolution for speed
        sensor_data.ds18b20.available = true;
    } else {
        Serial.println("[FAIL] DS18B20 not found on GPIO2");
        sensor_data.ds18b20.available = false;
    }
    
    // Initialize DHT22 (Humidity & Ambient Temp)
    dht.begin();
    delay(100);
    float test_humidity = dht.readHumidity();
    if (!isnan(test_humidity)) {
        Serial.println("[OK] DHT22 initialized");
        sensor_data.dht22.available = true;
    } else {
        Serial.println("[FAIL] DHT22 not responding on GPIO3");
        sensor_data.dht22.available = false;
    }
    
    Serial.println("============================================\n");
}

// ==================== SENSOR READING FUNCTIONS ====================

void read_max30102(SensorData& sensor_data) {
    if (!sensor_data.max30102.available) return;
    
    uint32_t now_ms = millis();
    if (now_ms - sensor_data.max30102.last_read_ms < 100) return; // Skip if too soon
    
    if (particleSensor.available()) {
        uint32_t irValue = particleSensor.getIR();
        
        // Simplified heart rate and SpO2 calculation
        // In production, use maxim_max30102_read_fifo.cpp library
        if (irValue > 50000) {
            sensor_data.max30102.heart_rate = 70; // Placeholder
            sensor_data.max30102.spo2 = 98;
        } else {
            sensor_data.max30102.heart_rate = 0;
            sensor_data.max30102.spo2 = 0;
        }
        
        particleSensor.nextSample();
        sensor_data.max30102.last_read_ms = now_ms;
    }
}

void read_mpu6050(SensorData& sensor_data) {
    if (!sensor_data.mpu6050.available) return;
    
    uint32_t now_ms = millis();
    if (now_ms - sensor_data.mpu6050.last_read_ms < 50) return;
    
    sensors_event_t a, g, temp;
    mpu.getEvent(&a, &g, &temp);
    
    sensor_data.mpu6050.accel_x = a.acceleration.x;
    sensor_data.mpu6050.accel_y = a.acceleration.y;
    sensor_data.mpu6050.accel_z = a.acceleration.z;
    sensor_data.mpu6050.gyro_x = g.gyro.x;
    sensor_data.mpu6050.gyro_y = g.gyro.y;
    sensor_data.mpu6050.gyro_z = g.gyro.z;
    sensor_data.mpu6050.temp = temp.temperature;
    
    // Fall detection
    float accel_mag = calculate_acceleration_magnitude(
        sensor_data.mpu6050.accel_x,
        sensor_data.mpu6050.accel_y,
        sensor_data.mpu6050.accel_z
    );
    sensor_data.mpu6050.fall_detected = detect_fall(accel_mag, FALL_DETECTION_THRESHOLD);
    
    sensor_data.mpu6050.last_read_ms = now_ms;
}

void read_ds18b20(SensorData& sensor_data) {
    if (!sensor_data.ds18b20.available) return;
    
    uint32_t now_ms = millis();
    if (now_ms - sensor_data.ds18b20.last_read_ms < 750) return; // DS18B20 needs 750ms
    
    sensors.requestTemperatures();
    sensor_data.ds18b20.temperature = sensors.getTempCByIndex(0);
    sensor_data.ds18b20.last_read_ms = now_ms;
}

void read_dht22(SensorData& sensor_data) {
    if (!sensor_data.dht22.available) return;
    
    uint32_t now_ms = millis();
    if (now_ms - sensor_data.dht22.last_read_ms < 2000) return; // DHT22 needs 2s between reads
    
    float humidity = dht.readHumidity();
    float temperature = dht.readTemperature();
    
    if (!isnan(humidity) && !isnan(temperature)) {
        sensor_data.dht22.humidity = humidity;
        sensor_data.dht22.temperature = temperature;
        sensor_data.dht22.last_read_ms = now_ms;
    }
}

// ==================== UTILITY FUNCTIONS ====================

float calculate_acceleration_magnitude(float x, float y, float z) {
    return sqrt(x * x + y * y + z * z);
}

bool detect_fall(float accel_mag, float threshold) {
    // Fall detection: sudden high acceleration or free fall (near 0)
    return (accel_mag > threshold) || (accel_mag < 1.0 && accel_mag > 0.1);
}

bool check_abnormal_conditions(const SensorData& sensor_data) {
    // Heart rate abnormal
    if (sensor_data.max30102.available && sensor_data.max30102.heart_rate > 0) {
        if (sensor_data.max30102.heart_rate < HEART_RATE_NORMAL_MIN || 
            sensor_data.max30102.heart_rate > HEART_RATE_NORMAL_MAX) {
            return true;
        }
    }
    
    // SpO2 abnormal
    if (sensor_data.max30102.available && sensor_data.max30102.spo2 > 0) {
        if (sensor_data.max30102.spo2 < SPO2_NORMAL_MIN) {
            return true;
        }
    }
    
    // Fall detected
    if (sensor_data.mpu6050.available && sensor_data.mpu6050.fall_detected) {
        return true;
    }
    
    // Temperature abnormal
    if (sensor_data.ds18b20.available && sensor_data.ds18b20.temperature > TEMP_WARNING_THRESHOLD) {
        return true;
    }
    
    // Humidity abnormal
    if (sensor_data.dht22.available && sensor_data.dht22.humidity > HUMIDITY_WARNING_THRESHOLD) {
        return true;
    }
    
    return false;
}

// ==================== DISPLAY FUNCTIONS ====================

void display_init() {
    if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDRESS)) {
        Serial.println("[FAIL] SSD1306 allocation failed");
        return;
    }
    Serial.println("[OK] SSD1306 OLED initialized");
    
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0, 0);
    display.println("ESP32-C3 Health Monitor");
    display.println("Initializing sensors...");
    display.display();
    delay(500);
}

void display_update(const SensorData& sensor_data) {
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);

    // Line 1 (y=0): heart rate & SpO2
    display.setCursor(0, 0);
    if (sensor_data.max30102.available) {
        display.print("HR:");
        display.print(sensor_data.max30102.heart_rate);
        display.print(" SpO2:");
        display.print(sensor_data.max30102.spo2);
        display.print("%");
    } else {
        display.print("HR:N/A SpO2:N/A");
    }

    // Line 2 (y=8): temperature and humidity
    display.setCursor(0, 8);
    if (sensor_data.ds18b20.available) {
        display.print("T:");
        display.print(sensor_data.ds18b20.temperature);
        display.print("C ");
    } else {
        display.print("T:N/A ");
    }
    if (sensor_data.dht22.available) {
        display.print("H:");
        display.print(sensor_data.dht22.humidity);
        display.print("%");
    } else {
        display.print("H:N/A");
    }

    // Line 3 (y=16): acceleration
    display.setCursor(0, 16);
    if (sensor_data.mpu6050.available) {
        float mag = calculate_acceleration_magnitude(
            sensor_data.mpu6050.accel_x,
            sensor_data.mpu6050.accel_y,
            sensor_data.mpu6050.accel_z
        );
        display.print("Acc:");
        display.print(mag, 1);
        display.print("G");
        if (sensor_data.mpu6050.fall_detected) {
            display.print("!");
        }
    } else {
        display.print("Acc:N/A");
    }

    // Line 4 (y=24): status/alert
    display.setCursor(0, 24);
    if (sensor_data.alert_active) {
        display.setTextColor(SSD1306_BLACK, SSD1306_WHITE); // inverse
        display.print("ALERT");
        display.setTextColor(SSD1306_WHITE);
    } else {
        display.print("OK");
    }

    display.display();
}

void display_error(const char* error_msg) {
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0, 0);
    display.println("ERROR");
    display.println(error_msg);
    display.display();
}

// ==================== BUZZER FUNCTIONS ====================

void buzzer_init() {
    pinMode(PIN_BUZZER, OUTPUT);
    digitalWrite(PIN_BUZZER, LOW);
    Serial.println("[OK] Buzzer initialized on GPIO10");
}

void buzzer_alert(uint8_t pattern) {
    switch (pattern) {
        case 1: // Short beep
            digitalWrite(PIN_BUZZER, HIGH);
            delay(100);
            digitalWrite(PIN_BUZZER, LOW);
            break;
        case 2: // Double beep
            for (int i = 0; i < 2; i++) {
                digitalWrite(PIN_BUZZER, HIGH);
                delay(100);
                digitalWrite(PIN_BUZZER, LOW);
                delay(100);
            }
            break;
        case 3: // Continuous
            digitalWrite(PIN_BUZZER, HIGH);
            break;
    }
}

void buzzer_stop() {
    digitalWrite(PIN_BUZZER, LOW);
}

// ==================== JSON SERIAL OUTPUT ====================

void send_json_data(const SensorData& sensor_data) {
    StaticJsonDocument<JSON_BUFFER_SIZE> doc;
    
    // Timestamps
    doc["timestamp_ms"] = millis();
    
    // MAX30102
    if (sensor_data.max30102.available) {
        doc["heart_rate"] = sensor_data.max30102.heart_rate;
        doc["spo2"] = sensor_data.max30102.spo2;
    }
    
    // MPU6050
    if (sensor_data.mpu6050.available) {
        doc["accel_x"] = sensor_data.mpu6050.accel_x;
        doc["accel_y"] = sensor_data.mpu6050.accel_y;
        doc["accel_z"] = sensor_data.mpu6050.accel_z;
        doc["fall_detected"] = sensor_data.mpu6050.fall_detected;
    }
    
    // DS18B20
    if (sensor_data.ds18b20.available) {
        doc["body_temp_c"] = sensor_data.ds18b20.temperature;
    }
    
    // DHT22
    if (sensor_data.dht22.available) {
        doc["humidity"] = sensor_data.dht22.humidity;
        doc["ambient_temp_c"] = sensor_data.dht22.temperature;
    }
    
    // Alert status
    doc["alert_active"] = sensor_data.alert_active;
    if (sensor_data.alert_active) {
        doc["alert_reason"] = sensor_data.alert_reason;
    }
    
    // Send JSON
    serializeJson(doc, Serial);
    Serial.println();
}

void print_sensor_status(const SensorData& sensor_data) {
    Serial.println("\n========== SENSOR STATUS ==========");
    Serial.print("MAX30102:  ");
    Serial.println(sensor_data.max30102.available ? "OK" : "OFFLINE");
    Serial.print("MPU6050:   ");
    Serial.println(sensor_data.mpu6050.available ? "OK" : "OFFLINE");
    Serial.print("DS18B20:   ");
    Serial.println(sensor_data.ds18b20.available ? "OK" : "OFFLINE");
    Serial.print("DHT22:     ");
    Serial.println(sensor_data.dht22.available ? "OK" : "OFFLINE");
    Serial.println("===================================\n");
}

void log_error(const char* sensor_name, const char* error) {
    Serial.print("[ERROR] ");
    Serial.print(sensor_name);
    Serial.print(": ");
    Serial.println(error);
}

// ==================== SETUP ====================

void setup() {
    Serial.begin(115200);
    delay(1000);
    
    Serial.println("\n\n");
    Serial.println("╔══════════════════════════════════════╗");
    Serial.println("║  ESP32-C3 SUPER MINI HEALTH MONITOR  ║");
    Serial.println("║         Firmware v1.0.0              ║");
    Serial.println("╚══════════════════════════════════════╝\n");
    
    // Initialize I2C
    Serial.println("[INIT] Configuring I2C...");
    I2C.begin(PIN_I2C_SDA, PIN_I2C_SCL, I2C_FREQ);
    delay(100);
    
    // Scan I2C bus
    if (ENABLE_I2C_SCAN) {
        i2c_scan_and_report();
    }
    
    // Initialize OLED
    if (ENABLE_OLED) {
        display_init();
    }
    
    // Initialize Buzzer
    if (ENABLE_BUZZER) {
        buzzer_init();
    }
    
    // Initialize all sensors
    sensors_init(gSensorData);
    
    // Print final status
    print_sensor_status(gSensorData);
    
    // Initialize timing
    nextSampleTime_ms = millis() + SAMPLE_INTERVAL_MS;
    nextDHTTime_ms = millis() + DHT_SAMPLE_INTERVAL_MS;
    nextDisplayTime_ms = millis() + OLED_UPDATE_INTERVAL_MS;
    nextSerialTime_ms = millis() + SAMPLE_INTERVAL_MS;
    
    Serial.println("✓ Setup complete. Starting main loop...\n");
}

// ==================== MAIN LOOP ====================

void loop() {
    uint32_t now_ms = millis();
    
    // ---- Non-blocking sensor reads ----
    
    // Sample all sensors regularly
    if (now_ms >= nextSampleTime_ms) {
        read_max30102(gSensorData);
        read_mpu6050(gSensorData);
        read_ds18b20(gSensorData);
        nextSampleTime_ms = now_ms + SAMPLE_INTERVAL_MS;
    }
    
    // DHT22 needs longer delay
    if (now_ms >= nextDHTTime_ms) {
        read_dht22(gSensorData);
        nextDHTTime_ms = now_ms + DHT_SAMPLE_INTERVAL_MS;
    }
    
    // ---- Update display ----
    if (ENABLE_OLED && now_ms >= nextDisplayTime_ms) {
        display_update(gSensorData);
        nextDisplayTime_ms = now_ms + OLED_UPDATE_INTERVAL_MS;
    }
    
    // ---- Check for abnormal conditions ----
    bool abnormal = check_abnormal_conditions(gSensorData);
    
    if (abnormal && !gSensorData.alert_active) {
        gSensorData.alert_active = true;
        
        // Determine alert reason
        if (gSensorData.mpu6050.fall_detected) {
            gSensorData.alert_reason = "FALL DETECTED!";
        } else if (gSensorData.max30102.available && gSensorData.max30102.heart_rate > HEART_RATE_NORMAL_MAX) {
            gSensorData.alert_reason = "High Heart Rate";
        } else if (gSensorData.ds18b20.available && gSensorData.ds18b20.temperature > TEMP_WARNING_THRESHOLD) {
            gSensorData.alert_reason = "High Body Temp";
        } else {
            gSensorData.alert_reason = "Abnormal vitals";
        }
        
        if (ENABLE_BUZZER) {
            buzzer_alert(2); // Double beep for alert
        }
    } else if (!abnormal && gSensorData.alert_active) {
        gSensorData.alert_active = false;
        if (ENABLE_BUZZER) {
            buzzer_stop();
        }
    }
    
    // ---- Send JSON data ----
    if (ENABLE_SERIAL_JSON && now_ms >= nextSerialTime_ms) {
        send_json_data(gSensorData);
        nextSerialTime_ms = now_ms + SAMPLE_INTERVAL_MS;
    }
    
    // Small delay to prevent watchdog issues
    yield();
}

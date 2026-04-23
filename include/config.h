#ifndef CONFIG_H
#define CONFIG_H

// ==================== PIN CONFIGURATION ====================
#define PIN_I2C_SDA 8
#define PIN_I2C_SCL 9
#define PIN_DS18B20 2
#define PIN_DHT22 3
#define PIN_BUZZER 10

// ==================== I2C CONFIGURATION ====================
#define I2C_FREQ 400000  // 400kHz for sensor compatibility

// ==================== SENSOR I2C ADDRESSES ====================
#define MAX30102_ADDRESS 0x57
#define MPU6050_ADDRESS 0x68
#define OLED_ADDRESS 0x3C

// ==================== SENSOR SAMPLING ====================
#define SAMPLE_INTERVAL_MS 2000      // 2 seconds
#define DHT_SAMPLE_INTERVAL_MS 5000  // 5 seconds (DHT22 needs delay)
#define OLED_UPDATE_INTERVAL_MS 1000 // Update display every second

// ==================== THRESHOLDS ====================
#define FALL_DETECTION_THRESHOLD 3.0  // G units
#define HEART_RATE_NORMAL_MIN 60
#define HEART_RATE_NORMAL_MAX 100
#define SPO2_NORMAL_MIN 95
#define TEMP_WARNING_THRESHOLD 38.0   // Celsius
#define HUMIDITY_WARNING_THRESHOLD 80 // %

// ==================== MEMORY OPTIMIZATION ====================
#define MAX_SENSOR_BUFFER 10
#define JSON_BUFFER_SIZE 256

// ==================== FEATURE FLAGS ====================
#define ENABLE_OLED 1
#define ENABLE_BUZZER 1
#define ENABLE_SERIAL_JSON 1
#define ENABLE_I2C_SCAN 1

#endif // CONFIG_H

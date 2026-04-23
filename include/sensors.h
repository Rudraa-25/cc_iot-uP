#ifndef SENSORS_H
#define SENSORS_H

#include <stdint.h>

// ==================== DATA STRUCTURES ====================

typedef struct {
  uint16_t heart_rate;
  uint8_t spo2;
  bool available;
  uint32_t last_read_ms;
} MAX30102_Data;

typedef struct {
  float accel_x;
  float accel_y;
  float accel_z;
  float gyro_x;
  float gyro_y;
  float gyro_z;
  float temp;
  bool fall_detected;
  bool available;
  uint32_t last_read_ms;
} MPU6050_Data;

typedef struct {
  float temperature;
  bool available;
  uint32_t last_read_ms;
} DS18B20_Data;

typedef struct {
  float humidity;
  float temperature;
  bool available;
  uint32_t last_read_ms;
} DHT22_Data;

typedef struct {
  MAX30102_Data max30102;
  MPU6050_Data mpu6050;
  DS18B20_Data ds18b20;
  DHT22_Data dht22;
  bool alert_active;
  const char* alert_reason;
} SensorData;

// ==================== SENSOR FUNCTIONS ====================

// Initialization
void sensors_init(SensorData& sensor_data);
void i2c_scan_and_report();

// Read Functions
void read_max30102(SensorData& sensor_data);
void read_mpu6050(SensorData& sensor_data);
void read_ds18b20(SensorData& sensor_data);
void read_dht22(SensorData& sensor_data);

// Utility
float calculate_acceleration_magnitude(float x, float y, float z);
bool detect_fall(float accel_mag, float threshold);
bool check_abnormal_conditions(const SensorData& sensor_data);

#endif // SENSORS_H

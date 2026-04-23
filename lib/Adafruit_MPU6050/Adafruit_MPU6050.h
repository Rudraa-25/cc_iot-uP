#ifndef ADAFRUIT_MPU6050_H
#define ADAFRUIT_MPU6050_H

#include <Arduino.h>
#include <Wire.h>

#define MPU6050_RANGE_16_G 0
#define MPU6050_RANGE_2000_DEG 0
#define MPU6050_BAND_21_HZ 0

typedef struct {
    float x;
    float y;
    float z;
} sensors_vec_t;

// simplified event struct containing accel, gyro and temperature
typedef struct {
    struct { float x, y, z; } acceleration;
    struct { float x, y, z; } gyro;
    float temperature;
} sensors_event_t;


class Adafruit_MPU6050 {
public:
    bool begin(uint8_t addr, TwoWire *wire, uint32_t freq) { return true; }
    void setAccelerometerRange(int) {}
    void setGyroRange(int) {}
    void setFilterBandwidth(int) {}
    void getEvent(sensors_event_t *a, sensors_event_t *g, sensors_event_t *temp) {
        if (a) { a->acceleration.x = a->acceleration.y = a->acceleration.z = 0; }
        if (g) { g->gyro.x = g->gyro.y = g->gyro.z = 0; }
        if (temp) { temp->temperature = 0; }
    }
};

#endif // ADAFRUIT_MPU6050_H

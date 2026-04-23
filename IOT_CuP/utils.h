#ifndef UTILS_H
#define UTILS_H

#include "sensors.h"

// ==================== DISPLAY FUNCTIONS ====================

void display_init();
void display_update(const SensorData& sensor_data);
void display_error(const char* error_msg);
void display_i2c_scan_results();

// ==================== BUZZER FUNCTIONS ====================

void buzzer_init();
void buzzer_alert(uint8_t pattern);  // pattern: 1=short, 2=double, 3=continuous
void buzzer_stop();

// ==================== SERIAL/JSON FUNCTIONS ====================

void send_json_data(const SensorData& sensor_data);

// ==================== UTILITY FUNCTIONS ====================

void print_sensor_status(const SensorData& sensor_data);
void log_error(const char* sensor_name, const char* error);

#endif // UTILS_H

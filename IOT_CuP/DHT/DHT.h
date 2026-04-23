#ifndef DHT_H
#define DHT_H

#include <Arduino.h>

#define DHT22 22

class DHT {
public:
    DHT(uint8_t pin, uint8_t type) {}
    void begin() {}
    float readHumidity() { return NAN; }
    float readTemperature() { return NAN; }
};

#endif // DHT_H

#ifndef ADAFRUIT_MAX30105_H
#define ADAFRUIT_MAX30105_H

#include <Arduino.h>
#include <Wire.h>

class Adafruit_MAX30105 {
public:
    bool begin(TwoWire &wire, uint32_t freq) { return true; }
    void setup() {}
    void setPulseAmplitudeRed(uint8_t) {}
    void setPulseAmplitudeIR(uint8_t) {}
    bool available() { return false; }
    uint32_t getIR() { return 0; }
    void nextSample() {}
};

#endif // ADAFRUIT_MAX30105_H

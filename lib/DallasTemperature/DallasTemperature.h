#ifndef DALLASTEMPERATURE_H
#define DALLASTEMPERATURE_H

#include "OneWire.h"

class DallasTemperature {
public:
    DallasTemperature(OneWire *ow) {}
    void begin() {}
    uint8_t getDeviceCount() { return 0; }
    void setResolution(int) {}
    void requestTemperatures() {}
    float getTempCByIndex(int idx) { return 0.0; }
};

#endif // DALLASTEMPERATURE_H

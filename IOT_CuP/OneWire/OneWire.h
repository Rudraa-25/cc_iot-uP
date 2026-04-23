#ifndef ONEWIRE_H
#define ONEWIRE_H

#include <Arduino.h>

class OneWire {
public:
    OneWire(uint8_t pin) {}
    uint8_t reset() { return 0; }
    void write(uint8_t v) {}
    uint8_t read() { return 0; }
};

#endif // ONEWIRE_H

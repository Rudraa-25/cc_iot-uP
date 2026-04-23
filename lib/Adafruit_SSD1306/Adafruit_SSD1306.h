#ifndef ADAFRUIT_SSD1306_H
#define ADAFRUIT_SSD1306_H

#include <Arduino.h>
#include <Wire.h>

#define SSD1306_SWITCHCAPVCC 0
#define SSD1306_WHITE 1
#define SSD1306_BLACK 0

class Adafruit_SSD1306 {
public:
    Adafruit_SSD1306(int16_t w, int16_t h, TwoWire *i2c = &Wire, int8_t rst = -1) {}
    bool begin(uint8_t vccstate, uint8_t i2caddr) { return true; }
    void clearDisplay() {}
    void setTextSize(uint8_t s) {}
    void setTextColor(uint16_t c, uint16_t bg = 0) {}
    void setCursor(int16_t x, int16_t y) {}
    void println(const char *s) {}
    void print(const char *s) {}
    void print(int v) {}
    void print(float v) {}
    void print(float v, int digits) {}
    void display() {}
};

#endif // ADAFRUIT_SSD1306_H

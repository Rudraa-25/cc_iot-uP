#ifndef STATICJSONDOCUMENT_H
#define STATICJSONDOCUMENT_H

#include <Arduino.h>

struct JsonObject {
    template<typename T>
    JsonObject& operator=(const T&) { return *this; }
    JsonObject operator[](const char*) { return JsonObject(); }
};

template <size_t N>
class StaticJsonDocument {
public:
    JsonObject operator[](const char* key) { return JsonObject(); }
};

template <size_t N>
inline void serializeJson(const StaticJsonDocument<N>&, Stream& s) {
    (void)s;
}

#endif // STATICJSONDOCUMENT_H

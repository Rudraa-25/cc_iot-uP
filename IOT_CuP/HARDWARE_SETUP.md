# Hardware Setup Guide

## Wiring Diagram

```
┌─────────────────────────────────────────────┐
│        ESP32-C3 Super Mini (Top View)      │
├─────────────────────────────────────────────┤
│                                             │
│  GND  3.3V  D6   D5   D4   D3   D2          │
│   │    │    │    │    │    │    │          │
│   ├────┼────┼────┼┬───┼────┼────┤          │
│   │    │    │    │├───┤    │    │          │
│   │    │    │    └┘   │    │    │          │
│   │    │    │         │    │    │          │
│   ├────┼────┼────┬────┼────┼────┤          │
│   │    │    │    │    │    │    │          │
│  GND  3.3V  D10  D9   D8   D7   D1          │
│   │    │    │    │    │    │    │          │
│   │    │    │    │    │    │    │          │
│   │    │    │    │    │    │    │          │
└─────────────────────────────────────────────┘

PIN ASSIGNMENTS:
GPIO2  = DS18B20 (1-Wire)
GPIO3  = DHT22 (Digital)
GPIO6  = TX0 (Serial)
GPIO7  = RX0 (Serial)
GPIO8  = I2C SDA
GPIO9  = I2C SCL
GPIO10 = Buzzer
```

---

## Component List & Connections

### I2C Sensors (GPIO8=SDA, GPIO9=SCL)

#### MAX30102 (Heart Rate/SpO2)
```
ESP32-C3    MAX30102
    3.3V ────→ VCC
    GND  ────→ GND
    GPIO8 ───→ SDA
    GPIO9 ───→ SCL
    ----- ────→ IRD (optional, pull-up)
```
- **I2C Address**: 0x57
- **Pull-up resistors**: 4.7k Ω on SDA/SCL (shared with other I2C devices)
- **Operating voltage**: 3.3V

#### MPU6050 (6-axis IMU)
```
ESP32-C3    MPU6050
    3.3V ────→ VCC
    GND  ────→ GND
    GPIO8 ───→ SDA
    GPIO9 ───→ SCL
```
- **I2C Address**: 0x68
- **Operating voltage**: 3.3V
- **Note**: AD0 pin pulled to GND for address 0x68

#### SSD1306 (0.91" 128x32 OLED)
```
ESP32-C3    SSD1306
    3.3V ────→ VCC
    GND  ────→ GND
    GPIO8 ───→ SDA
    GPIO9 ───→ SCL
```
- **I2C Address**: 0x3C
- **Display**: 128×32 pixels (0.91" module)
- **Operating voltage**: 3.3V

### 1-Wire Sensor (GPIO2)

#### DS18B20 (Body Temperature)
```
ESP32-C3    DS18B20 (TO-92 package)
                    ┌───────┐
                    · GND ──┤· GND
                    │ DQ  ──┤· DQ  ────→ GPIO2 + 4.7k pull-up to 3.3V
                    · VCC ──┤· VCC ──→ 3.3V
                    └───────┘

Wiring:
- Pin 1 (GND)  → GND
- Pin 2 (DQ)   → GPIO2 + pull-up resistor to 3.3V
- Pin 3 (VCC)  → 3.3V
```

**Pull-up configuration:**
```
         3.3V
          │
          │
        [4.7k Ω]
          │
    ┌─────┼─────────────→ GPIO2
    │     │
  ──┴──   │ DQ
  │ │  DS18B20
  └─┘
    │ GND
   GND
```

### Digital Sensor (GPIO3)

#### DHT22 (Humidity & Temperature)
```
ESP32-C3    DHT22 (4-pin DIP)
                 ┌────-───┐
               1 │ VCC    │ ← 3.3V
               2 │ DATA   │ ← GPIO3 + 10k pull-up
               3 │ NC     │ (not connected)
               4 │ GND    │ ← GND
                 └────────┘

Wiring:
- Pin 1 (VCC)  → 3.3V
- Pin 2 (DATA) → GPIO3 + pull-up resistor to 3.3V
- Pin 3 (NC)   → Not connected
- Pin 4 (GND)  → GND
```

**Pull-up configuration:**
```
         3.3V
          │
          │
        [10k Ω]
          │
    ┌─────┼─────────────→ GPIO3
    │     │
  ──┴──   │ DATA
  │ │  DHT22
  └─┘
    │ GND
   GND
```

### Output Device (GPIO10)

#### Buzzer
```
ESP32-C3    Buzzer
    GPIO10 ────→ Signal/+ pin
    GND    ────→ GND/- pin
    
Alternative with transistor (for high power):

                    +5V
                     │
                    [ ] 100Ω resistor
                     │
    GPIO10 ─[1kΩ]──┤ BC547 NPN transistor
                     │ (collector)
                     │
                    [=] Buzzer
                     │
                    GND
```

---

## Pull-up Resistor Configuration

### I2C Pull-ups
All I2C devices share the same SDA/SCL buses:
- **Total pull-up**: One 4.7k Ω resistor on SDA to 3.3V
- **Total pull-up**: One 4.7k Ω resistor on SCL to 3.3V

```
                    3.3V
                     │
                   [4.7k]
                     │
        ┌────────────┼──────────────────┐
        │            │                  │
      MAX30102    MPU6050           SSD1306
      SDA/SCL     SDA/SCL          SDA/SCL
```

### 1-Wire Pull-up
Single pull-up on GPIO2:
- **Value**: 4.7k Ω
- **Connection**: GPIO2 to 3.3V

### DHT22 Pull-up
Separate pull-up on GPIO3:
- **Value**: 10k Ω
- **Connection**: GPIO3 to 3.3V
- **Note**: Stronger pull-up than I2C due to digital protocol

---

## Component Specifications

| Component | Voltage | I2C Addr | Protocol | Notes |
|-----------|---------|----------|----------|-------|
| MAX30102  | 3.3V    | 0x57     | I2C      | Red LED indicates IR |
| MPU6050   | 3.3V    | 0x68     | I2C      | AD0=GND for this address |
| SSD1306   | 3.3V    | 0x3C     | I2C      | 4-pin: GND, VCC, SCL, SDA |
| DS18B20   | 3.3V    | N/A      | 1-Wire   | Needs 4.7k pull-up |
| DHT22     | 3.3V    | N/A      | Digital  | Needs 10k pull-up |
| Buzzer    | 3.3V*   | N/A      | Digital  | *Can use 5V with transistor |

---

## Testing Connections

### Pre-upload Checklist

- [ ] ESP32-C3 connected via USB
- [ ] All sensors wired to correct GPIO pins
- [ ] Pull-up resistors installed (4.7k on I2C, 4.7k on DS18B20, 10k on DHT22)
- [ ] 3.3V power rail verified with multimeter
- [ ] GND rail verified with multimeter
- [ ] No short circuits between pins
- [ ] USB cable supports data transfer (not power-only)

### Initial Upload Test

1. **Open Serial Monitor**
   ```bash
   platformio device monitor --baud 115200
   ```

2. **Should see**:
   ```
   ╔══════════════════════════════════════╗
   ║  ESP32-C3 SUPER MINI HEALTH MONITOR  ║
   ║         Firmware v1.0.0              ║
   ╚══════════════════════════════════════╝
   
   [INIT] Configuring I2C...
   
   ========================================
   I2C DEVICE SCAN
   ========================================
   I2C device found at address 0x3C
   I2C device found at address 0x57
   I2C device found at address 0x68
   Total devices: 3
   ========================================
   ```

3. **If sensors not found**:
   - Check I2C scan addresses
   - Verify power to sensor
   - Check pull-up resistor connections
   - Try addressing the chip directly

---

## Troubleshooting Checklist

| Issue | Cause | Fix |
|-------|-------|-----|
| No serial output | USB not recognized | Try different USB cable or port |
| I2C scan shows nothing | No power to sensors | Check 3.3V rail voltage |
| Only some sensors found | Wrong I2C address | Edit config.h and verify datasheet |
| MAX30102 no signal | IR LED off | Check power and alignment |
| DHT22 timeout | Pin conflict or no signal | Verify GPIO3 not used elsewhere |
| Buzzer not working | GPIO10 not connected | Check polarity and connection |
| OLED shows garbage | SDA/SCL swapped | Swap pins or check addresses |

---

## Power Budget

| Component | Current | Notes |
|-----------|---------|-------|
| ESP32-C3  | ~80mA   | Running, WiFi disabled |
| MAX30102  | ~20mA   | IR LEDs on |
| MPU6050   | ~2mA    | Powered |
| SSD1306   | ~15mA   | Full brightness, all pixels on |
| DHT22     | ~2mA    | Idle, <16mA during sampling |
| DS18B20   | <1mA    | Parasitic power |
| Buzzer    | ~100mA  | When active (short bursts) |
| **Total** | **~220mA** | **Typical (buzzer off)** |

**Recommendations**:
- Use USB for development (≥500mA available)
- Use 2A+ 3.3V regulator for production
- Add 100µF capacitor near sensor power pins

---

## Production Notes

1. **DIP switches for diagnostics**: Consider adding I2C address selector
2. **Test points**: Label test pads for each I2C address
3. **Power filtering**: Add 10µF + 100nF capacitors near each IC
4. **Connector standards**: Use JST-PH or similar for field replaceable sensors
5. **Documentation**: Label which GPIO does what on PCB silkscreen

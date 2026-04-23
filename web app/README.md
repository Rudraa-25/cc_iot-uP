# 🏥 ChainPulse — Healthcare IoT Monitoring System

ChainPulse is a full-stack healthcare IoT monitoring web application built with React, TypeScript, Tailwind CSS, and Firebase. It is designed to connect with ESP32 microcontrollers to provide real-time patient vitals monitoring and emergency fall detection.

## 🚀 Key Features

- **Real-time Vitals Monitoring**: Live streams of Heart Rate (BPM), SpO2 (%), Temperature (°C), and Humidity via Firebase Realtime Database.
- **Emergency Fall Detection**: Instant full-screen alerts and audible sirens when the wearable device detects a fall.
- **Role-Based Access**: Specialized dashboards for Patients and Doctors.
- **Historical Analysis**: Interactive glowing line charts for vital sign history over time.
- **Clinical Overview**: Unified dashboard for doctors to monitor multiple patients and manage clinical alerts.

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4 (CSS-first configuration)
- **Backend**: Firebase (Authentication, Firestore, Realtime Database)
- **Visualization**: Recharts
- **Animations**: Framer Motion
- **Icons**: Lucide React

## 📥 Getting Started

### 1. Installation

```bash
npm install
```

### 2. Firebase Configuration

The application is configured to use the following Firebase project: `studio-383948813-8374a`.
Credentials are pre-configured in `src/firebase/config.ts`.

### 3. Development Server

```bash
npm run dev
```

## 🏗️ Folder Structure

- `src/firebase/`: Initialization and configuration.
- `src/contexts/`: Authentication state management.
- `src/hooks/`: Custom hooks for real-time data (`useVitals`, `useFallAlert`, `usePatients`).
- `src/components/`: Reusable UI components (Vital cards, charts, alerts).
- `src/pages/`: Main application views (Landing, Auth, Dashboards).

## 📡 IoT Integration

Ensure your ESP32 device points to the following RTDB structure:

```
/patients/{patient_uid}/
  /vitals/
    heart_rate: number
    spo2: number
    temperature: number
    humidity: number
  /fall_status/
    detected: boolean
    g_force: number
    last_updated: timestamp
```

---
Developed as part of the ChainPulse Health system.

import { useState, useCallback, useRef, useEffect } from 'react';

interface BLEVitals {
  hr: number;
  spo2: number;
  tempBody: number;
  tempAmb: number;
  humidity: number;
  fall: boolean;
  gforce: number;
  roll: number;
  pitch: number;
  gyroX: number;
  gyroY: number;
  gyroZ: number;
  hrOk: boolean;
  spo2Ok: boolean;
  ts: number;
}

export type BLEState = 'idle' | 'connecting' | 'connected' | 'error' | 'unsupported';

const SERVICE_UUID = '12345678-1234-1234-1234-123456789012';
const CHAR_UUID = '12345678-1234-1234-1234-123456789010';

// Use any for BLE types since @types/web-bluetooth has compatibility issues
type BLEDevice = { gatt?: { connect: () => Promise<BLEServer>; connected: boolean; disconnect: () => void }; name?: string; addEventListener: (type: string, cb: () => void) => void };
type BLEServer = { getPrimaryService: (uuid: string) => Promise<BLEService> };
type BLEService = { getCharacteristic: (uuid: string) => Promise<BLEChar> };
type BLEChar = { startNotifications: () => Promise<void>; addEventListener: (type: string, cb: (e: { target: { value: DataView } }) => void) => void; removeEventListener: (type: string, cb: (e: { target: { value: DataView } }) => void) => void; value: DataView };

export function useBLE() {
  const nav = typeof navigator !== 'undefined' ? navigator : null;
  const hasBLE = nav && 'bluetooth' in nav;

  const [state, setState] = useState<BLEState>(hasBLE ? 'idle' : 'unsupported');
  const [vitals, setVitals] = useState<BLEVitals | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const deviceRef = useRef<BLEDevice | null>(null);
  const charRef = useRef<BLEChar | null>(null);
  const listenerRef = useRef<((e: { target: { value: DataView } }) => void) | null>(null);

  const handleNotification = useCallback((event: { target: { value: DataView } }) => {
    const decoder = new TextDecoder();
    const text = decoder.decode(event.target.value);
    try {
      const parsed = JSON.parse(text) as BLEVitals;
      setVitals(parsed);
    } catch {
      // ignore invalid packets
    }
  }, []);

  const connect = useCallback(async () => {
    if (!hasBLE) {
      setError('Web Bluetooth is not supported. Use Chrome or Edge.');
      return;
    }
    setState('connecting');
    setError(null);
    try {
      const bt = (nav as unknown as Record<string, unknown>).bluetooth as {
        requestDevice: (opts: Record<string, unknown>) => Promise<BLEDevice>;
      };
      const device = await bt.requestDevice({
        filters: [{ name: 'ChainPulse' }],
        optionalServices: [SERVICE_UUID],
      });
      deviceRef.current = device;
      setDeviceName(device.name ?? 'Unknown');

      device.addEventListener('gattserverdisconnected', () => {
        setState('idle');
        setVitals(null);
        charRef.current = null;
      });

      const server = await device.gatt!.connect();
      const service = await server.getPrimaryService(SERVICE_UUID);
      const char = await service.getCharacteristic(CHAR_UUID);
      charRef.current = char;
      listenerRef.current = handleNotification;
      await char.startNotifications();
      char.addEventListener('characteristicvaluechanged', handleNotification);
      setState('connected');
    } catch (e) {
      setState('error');
      setError(e instanceof Error ? e.message : 'BLE connection failed');
    }
  }, [hasBLE, nav, handleNotification]);

  const disconnect = useCallback(() => {
    if (charRef.current && listenerRef.current) {
      charRef.current.removeEventListener('characteristicvaluechanged', listenerRef.current);
      charRef.current = null;
      listenerRef.current = null;
    }
    if (deviceRef.current?.gatt?.connected) {
      deviceRef.current.gatt.disconnect();
    }
    deviceRef.current = null;
    setState('idle');
    setVitals(null);
  }, []);

  useEffect(() => {
    return () => { disconnect(); };
  }, [disconnect]);

  return { state, vitals, error, deviceName, connect, disconnect };
}

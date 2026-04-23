import { useState, useRef, useCallback, useEffect } from "react";

export interface SensorData {
  timestamp_ms: number;
  heart_rate: number;
  spo2: number;
  accel_x: number;
  accel_y: number;
  accel_z: number;
  fall_detected: boolean;
  body_temp_c: number;
  humidity: number;
  ambient_temp_c: number;
  alert_active: boolean;
  alert_reason: string;
}

export interface AlertEntry {
  timestamp: number;
  reason: string;
  fall_detected: boolean;
}

interface UseSerialReturn {
  data: SensorData | null;
  history: SensorData[];
  alerts: AlertEntry[];
  isConnected: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  rawJson: string;
  parseErrors: number;
}

const MAX_HISTORY = 600; // 60s at 10Hz
const MAX_ALERTS = 10;

export function useSerial(): UseSerialReturn {
  const [data, setData] = useState<SensorData | null>(null);
  const [history, setHistory] = useState<SensorData[]>([]);
  const [alerts, setAlerts] = useState<AlertEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawJson, setRawJson] = useState<string>("");
  const [parseErrors, setParseErrors] = useState(0);

  const portRef = useRef<any>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<string> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const bufferRef = useRef<string>("");

  const processLine = useCallback((line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    setRawJson(trimmed);

    try {
      const parsed = JSON.parse(trimmed) as SensorData;

      // Validate required fields
      if (typeof parsed.heart_rate !== "number" || typeof parsed.spo2 !== "number") {
        setParseErrors((p) => p + 1);
        return;
      }

      setData(parsed);
      setHistory((prev) => [...prev.slice(-(MAX_HISTORY - 1)), parsed]);

      // Track alerts
      if (parsed.fall_detected || parsed.alert_active) {
        setAlerts((prev) => [
          {
            timestamp: Date.now(),
            reason: parsed.alert_reason || (parsed.fall_detected ? "Fall Detected" : "Alert"),
            fall_detected: parsed.fall_detected,
          },
          ...prev,
        ].slice(0, MAX_ALERTS));
      }
    } catch {
      setParseErrors((p) => p + 1);
    }
  }, []);

  const readLoop = useCallback(async (port: any) => {
    const decoder = new TextDecoderStream();
    const abortController = new AbortController();
    abortRef.current = abortController;

    const readable = port.readable;
    if (!readable) return;

    readable.pipeTo(decoder.writable, { signal: abortController.signal }).catch(() => {});
    const reader = decoder.readable.getReader();
    readerRef.current = reader;

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          bufferRef.current += value;
          const lines = bufferRef.current.split("\n");
          bufferRef.current = lines.pop() || "";
          for (const line of lines) {
            processLine(line);
          }
        }
      }
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        setError("Serial read error");
      }
    } finally {
      reader.releaseLock();
    }
  }, [processLine]);

  const connect = useCallback(async () => {
    try {
      if (!("serial" in navigator)) {
        setError("Web Serial API not supported. Use Chrome or Edge.");
        return;
      }

      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 115200 });
      portRef.current = port;
      setIsConnected(true);
      setError(null);
      bufferRef.current = "";

      readLoop(port);

      port.addEventListener("disconnect", () => {
        setIsConnected(false);
        setError("Device disconnected");
        portRef.current = null;
      });
    } catch (err: any) {
      if (err?.name !== "NotFoundError") {
        setError(err?.message || "Failed to connect");
      }
    }
  }, [readLoop]);

  const disconnect = useCallback(async () => {
    try {
      abortRef.current?.abort();
      readerRef.current?.cancel().catch(() => {});
      await portRef.current?.close();
    } catch {
      // ignore
    }
    portRef.current = null;
    setIsConnected(false);
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return { data, history, alerts, isConnected, error, connect, disconnect, rawJson, parseErrors };
}

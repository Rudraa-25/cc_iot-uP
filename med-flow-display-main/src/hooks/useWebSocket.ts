import { useState, useEffect, useRef, useCallback } from "react";

export interface HealthData {
  heartRate: number;
  spo2: number;
  bodyTemp: number;
  humidity: number;
  fallDetected: boolean;
  timestamp: number;
}

interface UseWebSocketReturn {
  data: HealthData | null;
  history: HealthData[];
  isConnected: boolean;
  error: string | null;
  reconnectAttempt: number;
}

const MAX_HISTORY = 60;
const RECONNECT_INTERVAL = 3000;
const MAX_RECONNECT_ATTEMPTS = 50;

export function useWebSocket(url: string): UseWebSocketReturn {
  const [data, setData] = useState<HealthData | null>(null);
  const [history, setHistory] = useState<HealthData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        setReconnectAttempt(0);
      };

      ws.onmessage = (event) => {
        try {
          const parsed: HealthData = JSON.parse(event.data);
          setData(parsed);
          setHistory((prev) => [...prev.slice(-(MAX_HISTORY - 1)), parsed]);
        } catch {
          console.error("Failed to parse WebSocket message");
        }
      };

      ws.onerror = () => {
        setError("WebSocket connection error");
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;

        setReconnectAttempt((prev) => {
          const next = prev + 1;
          if (next <= MAX_RECONNECT_ATTEMPTS) {
            setError(`Disconnected. Reconnecting (${next})...`);
            reconnectTimerRef.current = setTimeout(connect, RECONNECT_INTERVAL);
          } else {
            setError("Max reconnection attempts reached.");
          }
          return next;
        });
      };
    } catch {
      setError("Failed to create WebSocket connection");
    }
  }, [url]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { data, history, isConnected, error, reconnectAttempt };
}

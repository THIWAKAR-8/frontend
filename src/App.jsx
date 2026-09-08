import React, { useState, useEffect } from 'react';

const WS_URL = "wss://smart-spoon-backend.onrender.com/ws";

export default function App() {
  const [status, setStatus] = useState("Connecting...");
  const [isLive, setIsLive] = useState(false);
  const [rawMessage, setRawMessage] = useState("Waiting for first WebSocket packet...");
  const [telemetry, setTelemetry] = useState({
    adulteration_type: "Connecting...",
    safety_score: 0,
    confidence: 0.0,
    frequency: 0,
    temperature: 0,
    ph: 6.7
  });

  useEffect(() => {
    let ws;
    let reconnectTimer;

    const connectWs = () => {
      ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        setIsLive(true);
        setStatus("LIVE");
      };

      ws.onmessage = (event) => {
        try {
          // Display the exact raw string on the page for deployment verification
          setRawMessage(event.data);
          const data = JSON.parse(event.data);
          setTelemetry(data);
        } catch (err) {
          console.error("Failed to parse WebSocket message", err);
        }
      };

      ws.onclose = () => {
        setIsLive(false);
        setStatus("RECONNECTING");
        reconnectTimer = setTimeout(connectWs, 3000);
      };

      ws.onerror = (err) => {
        console.error("WebSocket Error", err);
        ws.close();
      };
    };

    connectWs();

    return () => {
      if (ws) ws.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, []);

  return (
    <div style={{ background: '#0a0f1d', color: '#fff', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' }}>
      
      {/* --- LIVE DEPLOYMENT & WEBSOCKET DEBUG BANNER --- */}
      <div style={{ background: '#1e1b4b', border: '1px solid #4338ca', padding: '12px 20px', borderRadius: '8px', marginBottom: '20px' }}>
        <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#818cf8', fontWeight: 'bold' }}>
          🛠️ LIVE GITHUB/VERCEL DEPLOYMENT CHECKER:
        </p>
        <p style={{ margin: 0, fontSize: '13px', fontFamily: 'monospace', color: '#c7d2fe' }}>
          Raw WS Packet: {rawMessage}
        </p>
      </div>

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '15px' }}>
        <h2>Smart Spoon AI <span style={{ fontSize: '12px', color: '#38bdf8' }}>REAL-TIME TELEMETRY & ADULTERATION METROLOGY</span></h2>
        <div>
          <span style={{ 
            background: isLive ? '#10b981' : '#ef4444', 
            padding: '5px 12px', 
            borderRadius: '15px', 
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#fff'
          }}>
            {status}
          </span>
        </div>
      </header>

      <main style={{ marginTop: '20px' }}>
        <div style={{ background: '#111827', padding: '30px', borderRadius: '12px', border: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ color: '#9ca3af', fontSize: '14px', textTransform: 'uppercase' }}>Primary Verdict</p>
            <h1 style={{ fontSize: '42px', margin: '10px 0', color: '#f3f4f6' }}>{telemetry.adulteration_type}</h1>
          </div>
          <div style={{ textAlign: 'center', background: '#1f2937', padding: '20px', borderRadius: '12px', minWidth: '150px' }}>
            <p style={{ color: '#9ca3af', fontSize: '12px' }}>AI CONFIDENCE</p>
            <h2 style={{ color: '#38bdf8', margin: '5px 0' }}>{telemetry.confidence ? telemetry.confidence.toFixed(1) : 0}%</h2>
            <p style={{ color: '#6b7280', fontSize: '11px' }}>FREQ: {telemetry.frequency ? telemetry.frequency.toFixed(0) : 0} Hz</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginTop: '20px' }}>
          <div style={{ background: '#111827', padding: '20px', borderRadius: '12px', border: '1px solid #1f2937', textAlign: 'center' }}>
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>SAFETY SCORE</p>
            <h1 style={{ fontSize: '64px', color: '#10b981', margin: '20px 0' }}>{telemetry.safety_score}</h1>
          </div>
          <div style={{ background: '#111827', padding: '20px', borderRadius: '12px', border: '1px solid #1f2937' }}>
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>LIVE PH LEVEL & TEMP</p>
            <h2 style={{ color: '#38bdf8', margin: '15px 0' }}>pH: {telemetry.ph} | Temp: {telemetry.temperature}°C</h2>
            <div style={{ background: '#374151', height: '10px', borderRadius: '5px', overflow: 'hidden', marginTop: '10px' }}>
              <div style={{ width: `${((telemetry.ph || 7) / 14) * 100}%`, background: '#10b981', height: '100%' }}></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

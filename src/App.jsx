import React, { useState, useEffect } from 'react';

const WS_URL = "wss://smart-spoon-backend.onrender.com/ws";

export default function App() {
  const [status, setStatus] = useState("Connecting...");
  const [isLive, setIsLive] = useState(false);
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
      
      {/* --- HEADER --- */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '15px' }}>
        <h2>Smart Spoon AI <span style={{ fontSize: '12px', color: '#38bdf8' }}>REAL-TIME TELEMETRY & ADULTERATION METROLOGY</span></h2>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
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

      {/* --- MAIN TELEMETRY DASHBOARD --- */}
      <main style={{ marginTop: '20px' }}>
        
        {/* Primary Verdict & Confidence */}
        <div style={{ background: '#111827', padding: '30px', borderRadius: '12px', border: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ color: '#9ca3af', fontSize: '14px', textTransform: 'uppercase' }}>Primary Verdict</p>
            <h1 style={{ fontSize: '42px', margin: '10px 0', color: '#f3f4f6' }}>{telemetry.adulteration_type}</h1>
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button style={{ background: '#1f2937', color: '#fff', border: '1px solid #374151', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>DOWNLOAD CERTIFICATE</button>
              <button style={{ background: '#059669', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>SHARE ALERT</button>
            </div>
          </div>
          <div style={{ textAlign: 'center', background: '#1f2937', padding: '20px', borderRadius: '12px', minWidth: '180px', border: '1px solid #374151' }}>
            <p style={{ color: '#9ca3af', fontSize: '12px' }}>AI CONFIDENCE</p>
            <h2 style={{ color: '#38bdf8', margin: '5px 0' }}>{telemetry.confidence ? telemetry.confidence.toFixed(1) : 0.0}%</h2>
            <p style={{ color: '#6b7280', fontSize: '11px' }}>FREQ: {telemetry.frequency ? telemetry.frequency.toFixed(0) : 0} Hz</p>
          </div>
        </div>

        {/* Consumer Intelligence Section */}
        <h3 style={{ marginTop: '30px', color: '#9ca3af', fontSize: '14px', letterSpacing: '1px' }}>CONSUMER INTELLIGENCE</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginTop: '10px' }}>
          
          {/* Safety Score */}
          <div style={{ background: '#111827', padding: '20px', borderRadius: '12px', border: '1px solid #1f2937', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>SAFETY SCORE</p>
            <div style={{ width: '120px', height: '120px', borderRadius: '50%', border: '4px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '15px 0' }}>
              <span style={{ fontSize: '42px', fontWeight: 'bold', color: '#10b981' }}>{telemetry.safety_score}</span>
            </div>
          </div>

          {/* Live pH & Environmental Metrics */}
          <div style={{ background: '#111827', padding: '20px', borderRadius: '12px', border: '1px solid #1f2937', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ color: '#9ca3af', fontSize: '14px' }}>LIVE PH LEVEL</p>
                <h2 style={{ color: '#10b981', margin: 0 }}>{telemetry.ph}</h2>
              </div>
              <div style={{ background: 'linear-gradient(90deg, #ef4444 0%, #f59e0b 35%, #10b981 50%, #f59e0b 80%, #ef4444 100%)', height: '8px', borderRadius: '4px', marginTop: '15px' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#6b7280', marginTop: '5px' }}>
                <span>4.0 ACIDIC</span>
                <span>6.3-6.9 IDEAL</span>
                <span>9.0 ALKALINE</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
              <div style={{ background: '#1f2937', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                <p style={{ color: '#9ca3af', fontSize: '11px', margin: '0 0 5px 0' }}>COUNTERTOP LIFE</p>
                <span style={{ color: '#38bdf8', fontSize: '16px', fontWeight: 'bold' }}>{telemetry.temperature > 30 ? '2 Hours' : '6 Hours'}</span>
              </div>
              <div style={{ background: '#1f2937', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                <p style={{ color: '#9ca3af', fontSize: '11px', margin: '0 0 5px 0' }}>FRIDGE LIFE</p>
                <span style={{ color: '#38bdf8', fontSize: '16px', fontWeight: 'bold' }}>48 Hours</span>
              </div>
            </div>
          </div>
        </div>

        {/* Kitchen Directive */}
        <div style={{ background: '#111827', padding: '15px 20px', borderRadius: '12px', border: '1px solid #1f2937', marginTop: '20px' }}>
          <p style={{ color: '#9ca3af', fontSize: '12px', margin: '0 0 5px 0' }}>KITCHEN DIRECTIVE</p>
          <p style={{ color: '#f3f4f6', fontSize: '14px', margin: 0 }}>
            {telemetry.safety_score > 80 ? 'Sample is fresh and safe for consumption.' : 'Caution advised. Recommended to boil thoroughly before use.'} (Temp: {telemetry.temperature}°C)
          </p>
        </div>

        {/* Deep Technical Diagnostics */}
        <h3 style={{ marginTop: '30px', color: '#9ca3af', fontSize: '14px', letterSpacing: '1px' }}>DEEP TECHNICAL DIAGNOSTICS</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '10px' }}>
          <div style={{ background: '#111827', padding: '20px', borderRadius: '12px', border: '1px solid #1f2937', minHeight: '150px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>REAL-TIME EIS IMPEDANCE</p>
            <div style={{ textAlign: 'center', color: '#38bdf8', fontSize: '14px' }}>
              Z' Real: {(1000 / (telemetry.frequency || 1)).toFixed(2)} kΩ
            </div>
          </div>
          <div style={{ background: '#111827', padding: '20px', borderRadius: '12px', border: '1px solid #1f2937', minHeight: '150px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>AI PROBABILITY DISTRIBUTION</p>
            <div style={{ textAlign: 'center', color: '#10b981', fontSize: '14px' }}>
              Confidence Band: {telemetry.confidence ? telemetry.confidence.toFixed(1) : 0}%
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}

import React, { useRef, useState, useEffect, useCallback } from 'react';

const WS_URL = 'ws://localhost:8000/ws';
const SEND_INTERVAL = 300;       // ms — kitni baar frame bhejo
const CONFIRM_FRAMES = 3;        // kitne consecutive frames ke baad letter add karo
const COOLDOWN_MS = 1200;        // ek letter add hone ke baad kitna wait karo

function Detect() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const intervalRef = useRef(null);

  // ✅ FIX 1: Duplicate letters rokne ke liye yeh refs
  const signBufferRef = useRef([]);      // last N predictions ka buffer
  const lastAddedSignRef = useRef('');   // pichli baar kaunsa letter add hua
  const lastAddedTimeRef = useRef(0);    // kab add hua

  const [sign, setSign] = useState('—');
  const [confidence, setConfidence] = useState(0);
  const [top3, setTop3] = useState([]);
  const [text, setText] = useState('');
  const [history, setHistory] = useState([]);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState('Click "Start Camera" to begin');

  const handlePrediction = useCallback((data) => {
    setSign(data.sign);
    setConfidence(data.confidence);
    setTop3(data.top3 || []);

    if (data.sign === 'nothing' || data.confidence < 85) {
      signBufferRef.current = [];
      return;
    }

    // Buffer mein add karo
    signBufferRef.current.push(data.sign);
    if (signBufferRef.current.length > CONFIRM_FRAMES) {
      signBufferRef.current.shift();
    }

    // Sirf tab add karo jab:
    // 1. Buffer ke saare frames same sign ke hain
    // 2. Cooldown khatam ho gayi ho
    // 3. Ya naya alag sign ho
    const allSame = signBufferRef.current.length === CONFIRM_FRAMES &&
      signBufferRef.current.every(s => s === data.sign);

    const now = Date.now();
    const cooldownDone = (now - lastAddedTimeRef.current) > COOLDOWN_MS;
    const isDifferentSign = data.sign !== lastAddedSignRef.current;

    if (allSame && (cooldownDone || isDifferentSign)) {
      lastAddedSignRef.current = data.sign;
      lastAddedTimeRef.current = now;
      signBufferRef.current = [];

      if (data.sign === 'space') {
        setText(prev => prev + ' ');
      } else if (data.sign === 'del') {
        setText(prev => prev.slice(0, -1));
      } else {
        setText(prev => prev + data.sign);
        setHistory(h => [
          { sign: data.sign, time: new Date().toLocaleTimeString() },
          ...h.slice(0, 9)
        ]);
      }
    }
  }, []);

  const startSending = useCallback(() => {
    intervalRef.current = setInterval(() => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
      if (!videoRef.current || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // ✅ FIX 2: Canvas mein bhi mirror karo taaki model sahi se dekhe
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, -224, 0, 224, 224);
      ctx.restore();

      canvas.toBlob(blob => {
        if (blob && wsRef.current?.readyState === WebSocket.OPEN) {
          blob.arrayBuffer().then(buf => wsRef.current.send(buf));
        }
      }, 'image/jpeg', 0.85);
    }, SEND_INTERVAL);
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      videoRef.current.srcObject = stream;
      setStatus('Connecting to AI...');

      wsRef.current = new WebSocket(WS_URL);
      wsRef.current.onopen = () => {
        setStatus('AI Connected — Show your hand!');
        setRunning(true);
        startSending();
      };
      wsRef.current.onmessage = (e) => {
        const data = JSON.parse(e.data);
        handlePrediction(data);
      };
      wsRef.current.onerror = () => setStatus('Connection error — is backend running?');
      wsRef.current.onclose = () => { setStatus('Disconnected'); setRunning(false); };
    } catch (err) {
      setStatus('Camera access denied!');
    }
  };

  const stopCamera = useCallback(() => {
    clearInterval(intervalRef.current);
    if (wsRef.current) wsRef.current.close();
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }
    signBufferRef.current = [];
    setRunning(false);
    setStatus('Click "Start Camera" to begin');
    setSign('—');
    setConfidence(0);
  }, []);

  const speak = () => {
    if (!text) return;
    const utt = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utt);
  };

  useEffect(() => {
    return () => { stopCamera(); };
  }, [stopCamera]);

  const getConfColor = (conf) => {
    if (conf > 85) return 'var(--accent)';
    if (conf > 60) return 'var(--accent2)';
    return '#EF4444';
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>

      {/* Status bar */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: running ? 'var(--accent)' : 'var(--text2)' }}></div>
        <span style={{ fontSize: '13px', color: 'var(--text2)' }}>{status}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '24px' }}>

        {/* Left — Camera */}
        <div>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', position: 'relative', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <video ref={videoRef} autoPlay muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: running ? 'block' : 'none', transform: 'scaleX(-1)' }} />
            {!running && (
              <div style={{ textAlign: 'center', color: 'var(--text2)' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📷</div>
                <div style={{ fontSize: '14px' }}>Camera feed will appear here</div>
              </div>
            )}
            {['tl','tr','bl','br'].map(c => (
              <div key={c} style={{
                position: 'absolute', width: '16px', height: '16px',
                top: c.includes('t') ? '12px' : 'auto',
                bottom: c.includes('b') ? '12px' : 'auto',
                left: c.includes('l') ? '12px' : 'auto',
                right: c.includes('r') ? '12px' : 'auto',
                borderTop: c.includes('t') ? '2px solid var(--accent)' : 'none',
                borderBottom: c.includes('b') ? '2px solid var(--accent)' : 'none',
                borderLeft: c.includes('l') ? '2px solid var(--accent)' : 'none',
                borderRight: c.includes('r') ? '2px solid var(--accent)' : 'none',
              }} />
            ))}
            {running && (
              <div style={{ position: 'absolute', top: '12px', right: '40px', fontSize: '11px', color: 'var(--accent)', background: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: '4px' }}>● LIVE</div>
            )}
          </div>

          <canvas ref={canvasRef} width={224} height={224} style={{ display: 'none' }} />

          {/* Controls */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button onClick={running ? stopCamera : startCamera}
              style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: running ? '#EF4444' : 'var(--accent)', color: running ? '#fff' : 'var(--bg1)', fontSize: '14px', fontWeight: '600' }}>
              {running ? 'Stop Camera' : 'Start Camera'}
            </button>
            <button onClick={() => setText('')}
              style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text1)', fontSize: '14px' }}>
              Clear Text
            </button>
            <button onClick={speak}
              style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--accent2)', fontSize: '14px' }}>
              🔊 Speak
            </button>
          </div>

          {/* Text output */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', marginTop: '16px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text2)', letterSpacing: '2px', marginBottom: '10px' }}>TRANSLATION OUTPUT</div>
            <div style={{ fontSize: '24px', fontWeight: '500', letterSpacing: '3px', minHeight: '40px', color: 'var(--text1)' }}>
              {text || <span style={{ color: 'var(--text2)', fontSize: '16px' }}>Start signing...</span>}
              {running && <span style={{ color: 'var(--accent)', animation: 'blink 1s infinite' }}>|</span>}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: 'var(--text2)', letterSpacing: '2px', marginBottom: '8px' }}>DETECTED SIGN</div>
            <div style={{ fontSize: '72px', fontWeight: '600', color: 'var(--accent)', lineHeight: '1' }}>{sign}</div>
            <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '8px' }}>
              Confidence: <span style={{ color: getConfColor(confidence), fontWeight: '500' }}>{confidence}%</span>
            </div>
            {confidence > 0 && (
              <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', marginTop: '10px', overflow: 'hidden' }}>
                <div style={{ width: `${confidence}%`, height: '100%', background: getConfColor(confidence), borderRadius: '2px', transition: 'width 0.3s' }}></div>
              </div>
            )}
          </div>

          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text2)', letterSpacing: '2px', marginBottom: '12px' }}>TOP PREDICTIONS</div>
            {top3.length > 0 ? top3.map((p, i) => (
              <div key={i} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                  <span style={{ color: i === 0 ? 'var(--text1)' : 'var(--text2)', fontWeight: i === 0 ? '500' : '400' }}>{p.sign}</span>
                  <span style={{ color: i === 0 ? 'var(--accent)' : 'var(--text2)' }}>{p.conf}%</span>
                </div>
                <div style={{ height: '3px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${p.conf}%`, height: '100%', background: i === 0 ? 'var(--accent)' : 'var(--bg3)', borderRadius: '2px' }}></div>
                </div>
              </div>
            )) : <div style={{ fontSize: '13px', color: 'var(--text2)' }}>Start camera to see predictions</div>}
          </div>

          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', flex: 1 }}>
            <div style={{ fontSize: '11px', color: 'var(--text2)', letterSpacing: '2px', marginBottom: '12px' }}>HISTORY</div>
            {history.length > 0 ? history.map((h, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text1)', fontWeight: '500' }}>{h.sign}</span>
                <span style={{ color: 'var(--text2)' }}>{h.time}</span>
              </div>
            )) : <div style={{ fontSize: '13px', color: 'var(--text2)' }}>No history yet</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Detect;
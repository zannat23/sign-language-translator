import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Hands } from '@mediapipe/hands';

const CONFIRM_FRAMES = 7;
const COOLDOWN_MS = 3500;

function dist3(a, b) {
  return Math.sqrt((a.x-b.x)**2 + (a.y-b.y)**2 + (a.z-b.z)**2);
}
function dist2(a, b) {
  return Math.sqrt((a.x-b.x)**2 + (a.y-b.y)**2);
}
function isExtended(lm, tipIdx, pipIdx) {
  return dist3(lm[tipIdx], lm[0]) > dist3(lm[pipIdx], lm[0]);
}
function thumbExtended(lm) {
  return dist3(lm[4], lm[5]) > dist3(lm[3], lm[5]) * 0.9;
}
function touching(lm, a, b, thresh = 0.07) {
  return dist2(lm[a], lm[b]) < thresh;
}

function classifyASL(lm) {
  const idx  = isExtended(lm, 8,  6);
  const mid  = isExtended(lm, 12, 10);
  const ring = isExtended(lm, 16, 14);
  const pink = isExtended(lm, 20, 18);
  const tmb  = thumbExtended(lm);
  const extCount = [idx, mid, ring, pink].filter(Boolean).length;
  const imSpread = dist2(lm[8], lm[12]) > 0.12;

  const thumbIdxTouch  = touching(lm, 4, 8,  0.08);
  const thumbMidTouch  = touching(lm, 4, 12, 0.09);
  const thumbRingTouch = touching(lm, 4, 16, 0.10);
  const idxMidTouch    = touching(lm, 8, 12, 0.07);

  const thumbSide = lm[4].x < lm[3].x;
  const handWidth  = dist2(lm[5], lm[17]);
  const handHeight = dist2(lm[0], lm[9]);
  const isHorizontal = handWidth > handHeight * 1.1;

  const idxPartial = dist3(lm[8], lm[0]) > dist3(lm[6], lm[0]) * 0.8 &&
                     dist3(lm[8], lm[0]) < dist3(lm[6], lm[0]) * 1.3;
  const midPartial = dist3(lm[12], lm[0]) > dist3(lm[10], lm[0]) * 0.8 &&
                     dist3(lm[12], lm[0]) < dist3(lm[10], lm[0]) * 1.3;
  const cShape = idxPartial && midPartial && !thumbIdxTouch && tmb;
  if (cShape && extCount <= 2) return ['c', 82];

  if (extCount === 4 && tmb) return ['space', 90];
  if (extCount === 4 && !tmb && !imSpread) return ['b', 90];
  if (extCount === 4 && !tmb && imSpread) return ['space', 85];

  if (idx && mid && ring && !pink && !tmb) return ['w', 88];
  if (idx && mid && ring && !pink && tmb)  return ['w', 85];

  if (idx && mid && !ring && !pink) {
    if (idxMidTouch)  return ['r', 84];
    if (isHorizontal && !tmb) return ['h', 84];
    if (tmb && imSpread)  return ['k', 82];
    if (tmb && lm[8].y > lm[5].y) return ['p', 80];
    if (imSpread && !tmb) return ['v', 90];
    return ['u', 88];
  }

  if (idx && !mid && !ring && !pink) {
    if (tmb && isHorizontal && lm[8].x < lm[5].x) return ['g', 84];
    if (tmb && isHorizontal) return ['g', 82];
    if (tmb && !isHorizontal) return ['l', 88];
    if (thumbMidTouch || thumbRingTouch) return ['d', 86];
    return ['d', 80];
  }

  if (!idx && !mid && !ring && pink) {
    if (tmb) return ['y', 90];
    return ['i', 90];
  }

  if (idx && !mid && !ring && pink) {
    return ['i', 80];
  }

  if (extCount === 0) {
    if (thumbIdxTouch && !thumbMidTouch) return ['o', 88];
    if (thumbIdxTouch && mid && ring && pink) return ['f', 86];
    if (dist2(lm[4], lm[6]) < 0.07) return ['t', 84];
    if (dist2(lm[4], lm[10]) < 0.09 && lm[4].y > lm[9].y && lm[4].y < lm[7].y) return ['n', 82];
    if (dist2(lm[4], lm[14]) < 0.10 && lm[4].y > lm[13].y) return ['m', 80];
    if (dist2(lm[8], lm[6]) < 0.06 && !idx) return ['x', 78];
    if (thumbSide && lm[4].y < lm[8].y && !thumbIdxTouch) return ['a', 88];
    if (!thumbSide && lm[4].y < lm[9].y) return ['s', 84];
    if (lm[8].y > lm[5].y && lm[12].y > lm[9].y && lm[4].y > lm[8].y) return ['e', 82];
    return ['a', 70];
  }

  if (!idx && mid && ring && pink && thumbIdxTouch) return ['f', 86];
  if (idx && !mid && !ring && !pink && tmb && lm[8].y > lm[5].y + 0.1) return ['q', 78];

  return ['nothing', 0];
}

function Detect() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const handsRef = useRef(null);
  const rafRef = useRef(null);
  const signBufferRef = useRef([]);
  const lastAddedSignRef = useRef('');
  const lastAddedTimeRef = useRef(0);
  const audioCtxRef = useRef(null);

  const [sign, setSign] = useState('—');
  const [confidence, setConfidence] = useState(0);
  const [landmarks, setLandmarks] = useState(null);
  const [text, setText] = useState('');
  const [history, setHistory] = useState([]);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState('Click "Start Camera" to begin');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [signCount, setSignCount] = useState(0);

  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  }, []);

  const playHappySound = useCallback(() => {
    try {
      const audioCtx = audioCtxRef.current;
      if (!audioCtx) return;
      const notes = [523, 659, 784];
      notes.forEach((freq, i) => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + i * 0.08);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4 + i * 0.08);
        oscillator.start(audioCtx.currentTime + i * 0.08);
        oscillator.stop(audioCtx.currentTime + 0.5 + i * 0.08);
      });
    } catch(e) {
      console.log('Sound error:', e);
    }
  }, []);

  const handlePrediction = useCallback(([detectedSign, conf]) => {
    setSign(detectedSign === 'nothing' ? '—' : detectedSign.toUpperCase());
    setConfidence(conf);
    if (detectedSign === 'nothing' || conf < 75) { signBufferRef.current = []; return; }
    signBufferRef.current.push(detectedSign);
    if (signBufferRef.current.length > CONFIRM_FRAMES) signBufferRef.current.shift();
    const allSame = signBufferRef.current.length === CONFIRM_FRAMES &&
      signBufferRef.current.every(s => s === detectedSign);
    const now = Date.now();
    const cooldownDone = (now - lastAddedTimeRef.current) > COOLDOWN_MS;
    const isDiff = detectedSign !== lastAddedSignRef.current;
    if (allSame && (cooldownDone || isDiff)) {
      lastAddedSignRef.current = detectedSign;
      lastAddedTimeRef.current = now;
      signBufferRef.current = [];
      if (detectedSign === 'space') {
        setText(p => p + ' ');
        playHappySound();
      } else if (detectedSign === 'del') {
        setText(p => p.slice(0, -1));
      } else {
        setText(p => p + detectedSign.toUpperCase());
        setSignCount(p => p + 1);
        setHistory(h => [{ sign: detectedSign.toUpperCase(), time: new Date().toLocaleTimeString() }, ...h.slice(0, 9)]);
        playHappySound();
      }
    }
  }, [playHappySound]);

  const drawLandmarks = useCallback((ctx, lm, w, h) => {
    const connections = [
      [0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],
      [0,9],[9,10],[10,11],[11,12],[0,13],[13,14],[14,15],[15,16],
      [0,17],[17,18],[18,19],[19,20],[5,9],[9,13],[13,17],
    ];
    ctx.strokeStyle = 'rgba(45,212,191,0.7)';
    ctx.lineWidth = 2;
    connections.forEach(([a, b]) => {
      ctx.beginPath();
      ctx.moveTo(lm[a].x * w, lm[a].y * h);
      ctx.lineTo(lm[b].x * w, lm[b].y * h);
      ctx.stroke();
    });
    lm.forEach((pt, i) => {
      ctx.beginPath();
      ctx.arc(pt.x * w, pt.y * h, i === 0 ? 5 : 3, 0, 2 * Math.PI);
      ctx.fillStyle = i === 0 ? '#F59E0B' : '#2DD4BF';
      ctx.fill();
    });
  }, []);

  const startCamera = async () => {
    initAudio();
    setLoading(true);
    setStatus('Loading hand model…');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } });
      videoRef.current.srcObject = stream;
      await new Promise(res => { videoRef.current.onloadedmetadata = res; });
      videoRef.current.play();

      const hands = new Hands({ locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}` });
      hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.6, minTrackingConfidence: 0.5 });
      hands.onResults(results => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width, h = canvas.height;
        ctx.clearRect(0, 0, w, h);
        ctx.save(); ctx.scale(-1, 1); ctx.translate(-w, 0);
        ctx.drawImage(results.image, 0, 0, w, h);
        ctx.restore();
        if (results.multiHandLandmarks?.length > 0) {
          const lm = results.multiHandLandmarks[0];
          const mirroredLm = lm.map(pt => ({ x: 1 - pt.x, y: pt.y, z: pt.z }));
          setLandmarks(mirroredLm);
          drawLandmarks(ctx, mirroredLm, w, h);
          handlePrediction(classifyASL(mirroredLm));
        } else {
          setLandmarks(null);
          handlePrediction(['nothing', 0]);
        }
      });
      handsRef.current = hands;
      const processFrame = async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) { rafRef.current = requestAnimationFrame(processFrame); return; }
        await hands.send({ image: videoRef.current });
        rafRef.current = requestAnimationFrame(processFrame);
      };
      setRunning(true); setLoading(false);
      setStatus('Hand model ready — show your hand!');
      rafRef.current = requestAnimationFrame(processFrame);
    } catch (err) {
      setLoading(false);
      setStatus(err.name === 'NotAllowedError' ? 'Camera access denied!' : `Error: ${err.message}`);
    }
  };

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (handsRef.current) { handsRef.current.close(); handsRef.current = null; }
    if (videoRef.current?.srcObject) videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    if (canvasRef.current) canvasRef.current.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    signBufferRef.current = [];
    setRunning(false); setLoading(false);
    setStatus('Click "Start Camera" to begin');
    setSign('—'); setConfidence(0); setLandmarks(null);
  }, []);

  const speak = () => { if (text) window.speechSynthesis.speak(new SpeechSynthesisUtterance(text)); };

  const copyText = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => () => stopCamera(), [stopCamera]);
  const getConfColor = c => c > 80 ? 'var(--accent)' : c > 60 ? 'var(--accent2)' : '#EF4444';

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: running ? 'var(--accent)' : loading ? 'var(--accent2)' : 'var(--text2)', animation: loading ? 'pulse 1s infinite' : 'none' }} />
        <span style={{ fontSize: '13px', color: 'var(--text2)' }}>{status}</span>
        {running && <span style={{ fontSize: '11px', color: 'var(--accent2)', marginLeft: 'auto' }}>Signs: {signCount}</span>}
        {landmarks && <span style={{ fontSize: '11px', color: 'var(--accent)', marginLeft: running ? '12px' : 'auto' }}>✓ Hand detected</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '24px' }}>
        <div>
          <div style={{ background: '#000', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', position: 'relative', aspectRatio: '4/3' }}>
            <video ref={videoRef} autoPlay muted playsInline style={{ display: 'none' }} />
            <canvas ref={canvasRef} width={640} height={480} style={{ width: '100%', height: '100%', objectFit: 'cover', display: running ? 'block' : 'none' }} />
            {!running && !loading && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📷</div>
                <div style={{ fontSize: '14px' }}>Camera feed will appear here</div>
              </div>
            )}
            {loading && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', background: 'rgba(0,0,0,0.85)' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🤖</div>
                <div style={{ fontSize: '14px' }}>Loading hand model…</div>
                <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '6px' }}>First load may take a moment</div>
              </div>
            )}
            {['tl','tr','bl','br'].map(c => (
              <div key={c} style={{ position: 'absolute', width: '16px', height: '16px',
                top: c.includes('t') ? '12px' : 'auto', bottom: c.includes('b') ? '12px' : 'auto',
                left: c.includes('l') ? '12px' : 'auto', right: c.includes('r') ? '12px' : 'auto',
                borderTop: c.includes('t') ? '2px solid var(--accent)' : 'none',
                borderBottom: c.includes('b') ? '2px solid var(--accent)' : 'none',
                borderLeft: c.includes('l') ? '2px solid var(--accent)' : 'none',
                borderRight: c.includes('r') ? '2px solid var(--accent)' : 'none',
              }} />
            ))}
            {running && <div style={{ position: 'absolute', top: '12px', right: '40px', fontSize: '11px', color: 'var(--accent)', background: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: '4px' }}>● LIVE</div>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
            <button
              onClick={() => { initAudio(); running ? stopCamera() : startCamera(); }}
              disabled={loading}
              style={{ padding: '12px', borderRadius: '8px', border: 'none', background: running ? '#EF4444' : 'var(--accent)', color: running ? '#fff' : 'var(--bg1)', fontSize: '14px', fontWeight: '600', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Loading…' : running ? 'Stop Camera' : 'Start Camera'}
            </button>
            <button onClick={() => { setText(''); setSignCount(0); }}
              style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text1)', fontSize: '14px' }}>
              Clear Text
            </button>
            <button onClick={speak}
              style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--accent2)', fontSize: '14px' }}>
              🔊 Speak
            </button>
            <button onClick={copyText}
              style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: copied ? 'var(--accent)' : 'transparent', color: copied ? 'var(--bg1)' : 'var(--text1)', fontSize: '14px', transition: 'all 0.3s' }}>
              {copied ? '✓ Copied!' : '📋 Copy'}
            </button>
          </div>

          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', marginTop: '16px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text2)', letterSpacing: '2px', marginBottom: '10px' }}>TRANSLATION OUTPUT</div>
            <div style={{ fontSize: '24px', fontWeight: '500', letterSpacing: '3px', minHeight: '40px', color: 'var(--text1)' }}>
              {text || <span style={{ color: 'var(--text2)', fontSize: '16px' }}>Start signing…</span>}
              {running && <span style={{ color: 'var(--accent)' }}>|</span>}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: 'var(--text2)', letterSpacing: '2px', marginBottom: '8px' }}>DETECTED SIGN</div>
            <div style={{ fontSize: '72px', fontWeight: '600', color: 'var(--accent)', lineHeight: '1' }}>{sign}</div>
            <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '8px' }}>
              Confidence: <span style={{ color: getConfColor(confidence), fontWeight: '500' }}>{confidence}%</span>
            </div>
            {confidence > 0 && (
              <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', marginTop: '10px', overflow: 'hidden' }}>
                <div style={{ width: `${confidence}%`, height: '100%', background: getConfColor(confidence), borderRadius: '2px', transition: 'width 0.3s' }} />
              </div>
            )}
          </div>

          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text2)', letterSpacing: '2px', marginBottom: '10px' }}>TIPS</div>
            <div style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: '1.7' }}>
              • Keep hand in frame, palm facing camera<br/>
              • Good lighting helps detection<br/>
              • Hold sign steady for {CONFIRM_FRAMES} frames<br/>
              • Open hand = <strong style={{ color: 'var(--text1)' }}>SPACE</strong>
            </div>
          </div>

          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', flex: 1 }}>
            <div style={{ fontSize: '11px', color: 'var(--text2)', letterSpacing: '2px', marginBottom: '12px' }}>HISTORY</div>
            {history.length > 0 ? history.map((h, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text1)', fontWeight: '600', fontSize: '14px' }}>{h.sign}</span>
                <span style={{ color: 'var(--text2)' }}>{h.time}</span>
              </div>
            )) : <div style={{ fontSize: '13px', color: 'var(--text2)' }}>No history yet</div>}
          </div>
        </div>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}

export default Detect;
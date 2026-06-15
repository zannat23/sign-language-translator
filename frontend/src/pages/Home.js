import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-native';

function useCountUp(target, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0;
        const increment = target / (duration / 16);
        const timer = setInterval(() => {
          start += increment;
          if (start >= target) { setCount(target); clearInterval(timer); }
          else setCount(Math.floor(start));
        }, 16);
        observer.disconnect();
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);
  return [count, ref];
}

function Home() {
  const navigate = useNavigate();
  const [hoveredStep, setHoveredStep] = useState(null);
  const [acc, accRef] = useCountUp(99);
  const [classes, classRef] = useCountUp(30);
  const [ms, msRef] = useCountUp(300);
  const [datasets, datasetsRef] = useCountUp(2);

  const steps = [
    { icon: '📷', title: 'Capture', desc: 'Webcam captures your hand gesture in real-time' },
    { icon: '🖐️', title: 'Detect', desc: 'MediaPipe detects 21 hand landmarks instantly' },
    { icon: '🧠', title: 'Classify', desc: 'MobileNetV2 model predicts the ASL sign' },
    { icon: '💬', title: 'Translate', desc: 'Text appears and speech output is generated' },
  ];

  const impacts = [
    { val: '466M', label: 'People with hearing loss worldwide', icon: '🌍', accent: true },
    { val: '1%', label: 'Hearing people who understand sign language', icon: '😔', accent: false },
    { val: '74K+', label: 'Images used for training our model', icon: '🖼️', accent: true },
    { val: '99%+', label: 'Model accuracy on validation dataset', icon: '🎯', accent: false },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px' }}>

      {/* Hero Section */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '48px', alignItems: 'center',
        padding: '64px 0 48px',
        borderBottom: '1px solid var(--border)'
      }}>
        <div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
            <span style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(45,212,191,0.12)', color: 'var(--accent)', fontWeight: '500' }}>
              🤖 AI / ML Internship
            </span>
            <span style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(245,158,11,0.12)', color: 'var(--accent2)', fontWeight: '500' }}>
              🚀 Live Deployed
            </span>
          </div>

          <h1 style={{ fontSize: '42px', fontWeight: '700', lineHeight: '1.2', marginBottom: '16px' }}>
            Breaking barriers<br />
            with <span style={{
              color: 'var(--accent)',
              textShadow: '0 0 30px rgba(45,212,191,0.3)'
            }}>Sign Language AI</span>
          </h1>

          <p style={{ fontSize: '15px', color: 'var(--text2)', lineHeight: '1.8', marginBottom: '12px' }}>
            Real-time ASL translation powered by MobileNetV2 + MediaPipe. Show your hand — get instant text and speech output.
          </p>

          <p style={{ fontSize: '13px', color: 'var(--accent2)', marginBottom: '28px', fontWeight: '500' }}>
            🌍 466 million people worldwide have hearing loss — SignAI bridges the gap.
          </p>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => navigate('/detect')}
              style={{
                background: 'var(--accent)', color: 'var(--bg1)',
                border: 'none', padding: '13px 32px',
                borderRadius: '8px', fontSize: '14px', fontWeight: '700',
                cursor: 'pointer', boxShadow: '0 0 20px rgba(45,212,191,0.3)',
              }}
            >
              🎯 Try Live Demo
            </button>
            <button
              onClick={() => navigate('/guide')}
              style={{
                background: 'transparent', color: 'var(--text1)',
                border: '1px solid var(--border)', padding: '13px 32px',
                borderRadius: '8px', fontSize: '14px', cursor: 'pointer',
              }}
            >
              📚 ASL Guide
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {[
            { val: acc, suffix: '%+', label: 'Model Accuracy', ref: accRef, accent: true },
            { val: classes, suffix: '', label: 'ASL Sign Classes', ref: classRef, accent: false },
            { val: ms, suffix: 'ms', label: 'Response Time', ref: msRef, accent: true },
            { val: datasets, suffix: '', label: 'Datasets Combined', ref: datasetsRef, accent: false },
          ].map((s, i) => (
            <div key={i} ref={s.ref} style={{
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: '12px', padding: '24px',
              borderTop: s.accent ? '2px solid var(--accent)' : '1px solid var(--border)',
            }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: s.accent ? 'var(--accent)' : 'var(--text1)' }}>
                {s.val}{s.suffix}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How it Works */}
      <div style={{ padding: '48px 0', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: '11px', color: 'var(--accent)', letterSpacing: '3px', fontWeight: '600', marginBottom: '8px' }}>
          HOW IT WORKS
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '32px' }}>
          4 steps to real-time translation
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {steps.map((s, i) => (
            <div
              key={i}
              onMouseEnter={() => setHoveredStep(i)}
              onMouseLeave={() => setHoveredStep(null)}
              style={{
                background: hoveredStep === i ? 'rgba(45,212,191,0.08)' : 'var(--bg2)',
                border: hoveredStep === i ? '1px solid var(--accent)' : '1px solid var(--border)',
                borderRadius: '12px', padding: '24px',
                transition: 'all 0.3s', cursor: 'default',
                position: 'relative'
              }}
            >
              <div style={{
                position: 'absolute', top: '12px', right: '12px',
                fontSize: '11px', fontWeight: '700',
                color: 'var(--accent)', opacity: 0.5
              }}>
                0{i + 1}
              </div>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>{s.icon}</div>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: hoveredStep === i ? 'var(--accent)' : 'var(--text1)' }}>
                {s.title}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: '1.6' }}>
                {s.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Impact Section */}
      <div style={{ padding: '48px 0', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: '11px', color: 'var(--accent)', letterSpacing: '3px', fontWeight: '600', marginBottom: '8px' }}>
          WHY IT MATTERS
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '32px' }}>
          Real world impact
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {impacts.map((item, i) => (
            <div key={i} style={{
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: '12px', padding: '24px', textAlign: 'center',
              borderTop: item.accent ? '2px solid var(--accent)' : '1px solid var(--border)',
            }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>{item.icon}</div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: item.accent ? 'var(--accent)' : 'var(--accent2)', marginBottom: '8px' }}>
                {item.val}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: '1.5' }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Bottom */}
      <div style={{
        padding: '48px', margin: '48px 0',
        background: 'linear-gradient(135deg, rgba(45,212,191,0.08), rgba(245,158,11,0.05))',
        border: '1px solid var(--border)', borderRadius: '16px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '12px' }}>
          Ready to try SignAI? 🤟
        </div>
        <div style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '24px' }}>
          No installation required — just open and start signing
        </div>
        <button
          onClick={() => navigate('/detect')}
          style={{
            background: 'var(--accent)', color: 'var(--bg1)',
            border: 'none', padding: '14px 40px',
            borderRadius: '8px', fontSize: '15px', fontWeight: '700',
            cursor: 'pointer', boxShadow: '0 0 20px rgba(45,212,191,0.3)'
          }}
        >
          Launch SignAI →
        </button>
      </div>

    </div>
  );
}

export default Home;
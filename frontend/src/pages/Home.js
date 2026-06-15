import React from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  const stats = [
    { val: '99%+', label: 'Model Accuracy', accent: true },
    { val: '30', label: 'ASL Sign Classes', accent: false },
    { val: '300ms', label: 'Response Time', accent: true },
    { val: '2', label: 'Datasets Combined', accent: false },
  ];

  const features = [
    { icon: '🧠', title: 'MobileNetV2', desc: 'Transfer learning on 74K+ ASL images' },
    { icon: '🖐️', title: 'MediaPipe', desc: '21-point hand landmark detection' },
    { icon: '⚡', title: 'FastAPI + WebSocket', desc: 'Sub-300ms real-time inference' },
    { icon: '🔊', title: 'Text-to-Speech', desc: 'Web Speech API audio output' },
  ];

  const cardStyle = (i) => ({
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '20px',
    borderTop: i === 0 ? '2px solid var(--accent)' : '1px solid var(--border)',
  });

  return (
    <div style={{ padding: '48px 32px', maxWidth: '1200px', margin: '0 auto' }}>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center', marginBottom: '48px' }}>
        <div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <span style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(45,212,191,0.12)', color: 'var(--accent)', fontWeight: '500' }}>
              AI / ML Internship
            </span>
            <span style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(245,158,11,0.12)', color: 'var(--accent2)', fontWeight: '500' }}>
              Live Deployed
            </span>
          </div>

          <h1 style={{ fontSize: '40px', fontWeight: '600', lineHeight: '1.2', marginBottom: '16px' }}>
            Translate sign language
            <br />
            to text <span style={{ color: 'var(--accent)' }}>in real-time</span>
          </h1>

          <p style={{ fontSize: '15px', color: 'var(--text2)', lineHeight: '1.7', marginBottom: '28px' }}>
            MobileNetV2 + MediaPipe powered system that detects 30 ASL signs via webcam and converts them to text and speech instantly.
          </p>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => navigate('/detect')}
              style={{ background: 'var(--accent)', color: 'var(--bg1)', border: 'none', padding: '12px 28px', borderRadius: '8px', fontSize: '14px', fontWeight: '600' }}
            >
              Try Live Demo
            </button>
            <button
              onClick={() => window.open('https://github.com/zannat23/sign-language-translator', '_blank')}
              style={{ background: 'transparent', color: 'var(--text1)', border: '1px solid var(--border)', padding: '12px 28px', borderRadius: '8px', fontSize: '14px' }}
            >
              View GitHub
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {stats.map((s, i) => (
            <div key={i} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
              <div style={{ fontSize: '28px', fontWeight: '600', color: s.accent ? 'var(--accent)' : 'var(--text1)' }}>
                {s.val}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {features.map((f, i) => (
          <div key={i} style={cardStyle(i)}>
            <div style={{ fontSize: '24px', marginBottom: '12px' }}>
              {f.icon}
            </div>
            <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
              {f.title}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: '1.5' }}>
              {f.desc}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

export default Home;
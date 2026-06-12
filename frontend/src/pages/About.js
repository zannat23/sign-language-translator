import React from 'react';

function About() {
  const steps = [
    { num: '1', text: 'Webcam captures hand gesture frame' },
    { num: '2', text: 'MediaPipe detects 21 hand landmarks' },
    { num: '3', text: 'MobileNetV2 predicts sign class' },
    { num: '4', text: 'FastAPI sends result via WebSocket' },
    { num: '5', text: 'React UI displays text + speaks output' },
  ];

  const team = [
    { id: 'ZA', name: 'Zannat', role: 'ML Engineer', task: 'Model training, accuracy tuning, Kaggle notebook, model export', color: 'var(--accent)' },
    { id: 'AV', name: 'Ananay Verma', role: 'Frontend Dev', task: 'React UI, webcam integration, real-time display, Vercel deploy', color: 'var(--accent2)' },
    { id: 'KY', name: 'Krishna Yadav', role: 'Backend Dev', task: 'FastAPI, WebSocket, model loading, REST API, Render deploy', color: 'var(--accent)' },
    { id: 'AK', name: 'Aditi Kamal', role: 'DevOps + Docs', task: 'Deployment, README, PPT, Research paper, demo recording', color: 'var(--accent2)' },
    { id: 'AS', name: 'Akanksha Singh', role: 'Data Engineer', task: 'Dataset preprocessing, augmentation, landmark extraction, testing', color: 'var(--text2)' },
  ];

  const techStack = [
    { category: 'AI / ML', items: ['TensorFlow', 'MobileNetV2', 'MediaPipe', 'OpenCV'] },
    { category: 'Backend', items: ['Python', 'FastAPI', 'WebSocket', 'Uvicorn'] },
    { category: 'Frontend', items: ['React.js', 'Web Speech API', 'WebSocket Client'] },
    { category: 'Deployment', items: ['Render (Backend)', 'Vercel (Frontend)'] },
  ];

  return (
    <div style={{ padding: '48px 32px', maxWidth: '1200px', margin: '0 auto' }}>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>About SignAI</h2>
          <p style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: '1.7', marginBottom: '16px' }}>
            SignAI is a real-time ASL translation system built in 5 days during our AI/ML internship. It bridges the communication gap for the deaf and mute community using deep learning and computer vision.
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['MobileNetV2', 'MediaPipe', 'FastAPI', 'React.js', '98%+ Accuracy'].map((tag, i) => (
              <span key={i} style={{
                fontSize: '11px', padding: '4px 10px', borderRadius: '20px',
                background: i % 2 === 0 ? 'rgba(45,212,191,0.12)' : 'rgba(245,158,11,0.12)',
                color: i % 2 === 0 ? 'var(--accent)' : 'var(--accent2)',
                fontWeight: '500'
              }}>{tag}</span>
            ))}
          </div>
        </div>

        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>How It Works</h2>
          {steps.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '22px', height: '22px', borderRadius: '50%',
                background: 'rgba(45,212,191,0.15)', color: 'var(--accent)',
                fontSize: '11px', fontWeight: '600',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, marginTop: '2px'
              }}>{s.num}</div>
              <span style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: '1.5' }}>{s.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>Tech Stack</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {techStack.map((t, i) => (
            <div key={i}>
              <div style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: '600', letterSpacing: '1px', marginBottom: '10px' }}>{t.category}</div>
              {t.items.map((item, j) => (
                <div key={j} style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }}></div>
                  {item}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>Our Team</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
          {team.map((m, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: `rgba(${m.color === 'var(--accent)' ? '45,212,191' : m.color === 'var(--accent2)' ? '245,158,11' : '139,138,155'},0.15)`,
                color: m.color,
                fontSize: '13px', fontWeight: '600',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 10px',
                border: `1px solid rgba(${m.color === 'var(--accent)' ? '45,212,191' : m.color === 'var(--accent2)' ? '245,158,11' : '139,138,155'},0.2)`,
              }}>{m.id}</div>
              <div style={{ fontSize: '12px', color: m.color, fontWeight: '600', marginBottom: '2px' }}>{m.name}</div>
              <div style={{ fontSize: '11px', fontWeight: '500', color: 'var(--text1)', marginBottom: '4px' }}>{m.role}</div>
              <div style={{ fontSize: '10px', color: 'var(--text2)', lineHeight: '1.4' }}>{m.task}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

export default About;
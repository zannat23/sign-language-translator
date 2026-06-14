import React, { useState } from 'react';

const aslSigns = [
  { letter: 'A', description: 'Closed fist, thumb rests on side of index finger' },
  { letter: 'B', description: 'Four fingers up straight, thumb tucked across palm' },
  { letter: 'C', description: 'Curved hand forming letter C shape, thumb and fingers curved' },
  { letter: 'D', description: 'Index finger up, other fingers touch thumb forming circle' },
  { letter: 'E', description: 'Fingers bent down, thumb tucked under fingers' },
  { letter: 'F', description: 'Thumb and index touch, other three fingers up and spread' },
  { letter: 'G', description: 'Index finger and thumb point sideways horizontally' },
  { letter: 'H', description: 'Index and middle finger extended horizontally side by side' },
  { letter: 'I', description: 'Pinky finger up, all other fingers closed' },
  { letter: 'J', description: 'Pinky up then draw J shape in air (motion sign)' },
  { letter: 'K', description: 'Index up, middle finger angled, thumb between them' },
  { letter: 'L', description: 'Index finger up, thumb out — forming L shape' },
  { letter: 'M', description: 'Three fingers folded over tucked thumb' },
  { letter: 'N', description: 'Two fingers folded over tucked thumb' },
  { letter: 'O', description: 'All fingers and thumb curved to form O shape' },
  { letter: 'P', description: 'Like K but pointing downward' },
  { letter: 'Q', description: 'Like G but pointing downward' },
  { letter: 'R', description: 'Index and middle finger crossed over each other' },
  { letter: 'S', description: 'Closed fist, thumb wrapped over fingers' },
  { letter: 'T', description: 'Thumb inserted between index and middle finger' },
  { letter: 'U', description: 'Index and middle finger up together, side by side' },
  { letter: 'V', description: 'Index and middle finger up and spread apart — V shape' },
  { letter: 'W', description: 'Three fingers up and spread — index, middle, ring' },
  { letter: 'X', description: 'Index finger hooked/bent like a hook' },
  { letter: 'Y', description: 'Thumb and pinky extended out, other fingers closed' },
  { letter: 'Z', description: 'Index finger draws Z shape in air (motion sign)' },
  { letter: 'SPACE', description: 'Open hand — all five fingers extended and spread' },
  { letter: 'DEL', description: 'Delete last letter — specific gesture' },
];

function ASLGuide() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const filtered = aslSigns.filter(s =>
    s.letter.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '48px 32px', maxWidth: '1200px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '8px' }}>
          ASL <span style={{ color: 'var(--accent)' }}>Reference Guide</span>
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text2)' }}>
          American Sign Language — A to Z hand sign reference
        </p>
      </div>

      {/* Search */}
      <input
        placeholder="Search letter..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: '100%', padding: '12px 16px', borderRadius: '8px',
          border: '1px solid var(--border)', background: 'var(--bg2)',
          color: 'var(--text1)', fontSize: '14px', marginBottom: '24px',
          outline: 'none'
        }}
      />

      {/* Selected Card */}
      {selected && (
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--accent)',
          borderRadius: '12px', padding: '24px', marginBottom: '24px',
          display: 'flex', alignItems: 'center', gap: '24px'
        }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '12px',
            background: 'rgba(45,212,191,0.15)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: '48px', fontWeight: '700', color: 'var(--accent)',
            flexShrink: 0
          }}>
            {selected.letter}
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
              Sign — {selected.letter}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: '1.6' }}>
              {selected.description}
            </div>
            {(selected.letter === 'J' || selected.letter === 'Z') && (
              <div style={{
                marginTop: '10px', fontSize: '12px', padding: '4px 10px',
                borderRadius: '20px', background: 'rgba(245,158,11,0.15)',
                color: 'var(--accent2)', display: 'inline-block'
              }}>
                ⚡ Motion-based sign
              </div>
            )}
          </div>
          <button
            onClick={() => setSelected(null)}
            style={{
              marginLeft: 'auto', background: 'transparent', border: 'none',
              color: 'var(--text2)', fontSize: '20px', cursor: 'pointer'
            }}>
            ✕
          </button>
        </div>
      )}

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
        gap: '12px'
      }}>
        {filtered.map((s, i) => (
          <div
            key={i}
            onClick={() => setSelected(s)}
            style={{
              background: selected?.letter === s.letter ? 'rgba(45,212,191,0.15)' : 'var(--bg2)',
              border: selected?.letter === s.letter ? '1px solid var(--accent)' : '1px solid var(--border)',
              borderRadius: '12px', padding: '20px 12px',
              textAlign: 'center', cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{
              fontSize: '36px', fontWeight: '700',
              color: selected?.letter === s.letter ? 'var(--accent)' : 'var(--text1)',
              marginBottom: '8px'
            }}>
              {s.letter}
            </div>
            <div style={{
              fontSize: '10px', color: 'var(--text2)',
              lineHeight: '1.4', overflow: 'hidden',
              display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}>
              {s.description}
            </div>
            {(s.letter === 'J' || s.letter === 'Z') && (
              <div style={{
                marginTop: '6px', fontSize: '9px',
                color: 'var(--accent2)'
              }}>
                ⚡ Motion
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Stats */}
      <div style={{
        marginTop: '32px', padding: '16px 20px',
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: '12px', display: 'flex', gap: '32px'
      }}>
        <div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--accent)' }}>26</div>
          <div style={{ fontSize: '12px', color: 'var(--text2)' }}>Total Letters</div>
        </div>
        <div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--accent2)' }}>24</div>
          <div style={{ fontSize: '12px', color: 'var(--text2)' }}>Static Signs</div>
        </div>
        <div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#EF4444' }}>2</div>
          <div style={{ fontSize: '12px', color: 'var(--text2)' }}>Motion Signs (J, Z)</div>
        </div>
      </div>

    </div>
  );
}

export default ASLGuide;
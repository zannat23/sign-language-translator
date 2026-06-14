import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const links = [
    { name: 'Home', path: '/' },
    { name: 'Detect', path: '/detect' },
    { name: 'Guide', path: '/guide' },
    { name: 'About', path: '/about' },
  ];

  return (
    <nav style={{
      background: 'var(--bg1)',
      borderBottom: '1px solid var(--border)',
      padding: '0 32px',
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{ fontSize: '18px', fontWeight: '600', letterSpacing: '0.5px' }}>
        Sign<span style={{ color: 'var(--accent)' }}>AI</span>
      </div>

      <div style={{ display: 'flex', gap: '28px' }}>
        {links.map(link => (
          <span
            key={link.path}
            onClick={() => navigate(link.path)}
            style={{
              fontSize: '14px',
              color: location.pathname === link.path ? 'var(--text1)' : 'var(--text2)',
              fontWeight: location.pathname === link.path ? '500' : '400',
              cursor: 'pointer',
              borderBottom: location.pathname === link.path ? '2px solid var(--accent)' : '2px solid transparent',
              paddingBottom: '4px',
              transition: 'all 0.2s',
            }}
          >
            {link.name}
          </span>
        ))}
      </div>

      <button
        onClick={() => navigate('/detect')}
        style={{
          background: 'var(--accent)',
          color: 'var(--bg1)',
          border: 'none',
          padding: '8px 20px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: '600',
        }}
      >
        Launch App
      </button>
    </nav>
  );
}

export default Navbar;
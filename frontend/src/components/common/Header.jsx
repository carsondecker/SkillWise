// TODO: Implement main navigation header component
import React, { useEffect, useState } from 'react';

const Header = () => {
  const [aiBanner, setAiBanner] = useState(null);

  useEffect(() => {
    const onDown = (e) => {
      const msg = e?.detail?.message || 'AI feature currently unavailable';
      setAiBanner({ type: 'down', message: msg });
    };
    const onUp = () => setAiBanner(null);

    window.addEventListener('ai:down', onDown);
    window.addEventListener('ai:up', onUp);

    return () => {
      window.removeEventListener('ai:down', onDown);
      window.removeEventListener('ai:up', onUp);
    };
  }, []);

  return (
    <>
      {aiBanner && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            background: '#ffefc2',
            color: '#663c00',
            padding: '10px 16px',
            zIndex: 9999,
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <strong>AI Unavailable</strong>
            <div style={{ fontSize: 12 }}>{aiBanner.message}</div>
          </div>
          <div>
            <button
              onClick={() => setAiBanner(null)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: 16,
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <header className="header">
        <div className="container">
          <div className="nav-brand">
            <h1>SkillWise</h1>
          </div>
          <nav className="nav-menu">
            {/* TODO: Add navigation items */}
          </nav>
          <div className="nav-actions">
            {/* TODO: Add user profile, notifications */}
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;

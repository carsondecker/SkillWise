// TODO: Implement main navigation header component
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const Header = () => {
  const { user, logout } = useAuth() || {};
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 'n1', text: 'New challenge recommended for you', read: false, time: '2h' },
    { id: 'n2', text: 'Your submission was reviewed', read: false, time: '1d' },
  ]);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  const handleLogout = async () => {
    try {
      await logout?.();
    } catch (err) {
      // ignore
    }
  };

  return (
    <header className="header" style={{ borderBottom: '1px solid #eee', background: '#fff' }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'space-between', padding: '12px 16px' }}>
        <div className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/" className="brand-link" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>SW</div>
            <div>
              <h1 style={{ margin: 0, fontSize: 18 }}>SkillWise</h1>
              <div style={{ fontSize: 12, color: '#666' }}>Learn • Build • Share</div>
            </div>
          </Link>
        </div>

        <nav className="nav-menu" aria-label="Main navigation">
          <ul style={{ display: 'flex', gap: 12, listStyle: 'none', margin: 0, padding: 0 }}>
            <li><Link to="/challenges">Challenges</Link></li>
            <li><Link to="/goals">Goals</Link></li>
            <li><Link to="/progress">Progress</Link></li>
            <li><Link to="/leaderboard">Leaderboard</Link></li>
            <li><Link to="/peer-review">Peer Review</Link></li>
          </ul>
        </nav>

        <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Notifications */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button
              className="btn-icon"
              aria-label={`Notifications (${unreadCount})`}
              onClick={() => { setNotifOpen(v => !v); setProfileOpen(false); }}
              title="Notifications"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              🔔
              {unreadCount > 0 && (
                <span style={{ background: '#e74c3c', color: '#fff', borderRadius: 999, padding: '2px 6px', fontSize: 11, marginLeft: 6 }}>{unreadCount}</span>
              )}
            </button>

            {notifOpen && (
              <div style={{ position: 'absolute', right: 0, top: '120%', width: 320, background: '#fff', boxShadow: '0 6px 18px rgba(0,0,0,0.08)', borderRadius: 8, padding: 12, zIndex: 60 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <strong>Notifications</strong>
                  <button onClick={markAllRead} className="btn-link" style={{ fontSize: 12, background: 'transparent', border: 'none', cursor: 'pointer' }}>Mark all read</button>
                </div>

                {notifications.length === 0 ? (
                  <div style={{ padding: 12, color: '#666' }}>No notifications</div>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 220, overflow: 'auto' }}>
                    {notifications.map(n => (
                      <li key={n.id} style={{ padding: '8px 6px', borderBottom: '1px solid #f1f1f1', display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, color: n.read ? '#666' : '#111' }}>{n.text}</div>
                          <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{n.time}</div>
                        </div>
                        {!n.read && <div style={{ width: 8, height: 8, background: '#2ecc71', borderRadius: 999, alignSelf: 'center' }} aria-hidden="true" />}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Profile */}
          <div ref={profileRef} style={{ position: 'relative' }}>
            <button
              className="profile-btn"
              onClick={() => { setProfileOpen(v => !v); setNotifOpen(false); }}
              aria-haspopup="true"
              aria-expanded={profileOpen}
              title="Open profile menu"
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 999, background: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                {user?.firstName ? user.firstName[0].toUpperCase() : 'U'}
              </div>
            </button>

            {profileOpen && (
              <div style={{ position: 'absolute', right: 0, top: '120%', width: 220, background: '#fff', boxShadow: '0 6px 18px rgba(0,0,0,0.08)', borderRadius: 8, padding: 8, zIndex: 60 }}>
                <div style={{ padding: '8px 12px', borderBottom: '1px solid #f6f6f6' }}>
                  <div style={{ fontWeight: 700 }}>{user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Guest'}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>{user?.email || ''}</div>
                </div>

                <ul style={{ listStyle: 'none', padding: 8, margin: 0 }}>
                  <li><Link to="/profile" onClick={() => setProfileOpen(false)} style={{ display: 'block', padding: '8px 6px' }}>Profile</Link></li>
                  <li><Link to="/settings" onClick={() => setProfileOpen(false)} style={{ display: 'block', padding: '8px 6px' }}>Settings</Link></li>
                  <li><Link to="/dashboard" onClick={() => setProfileOpen(false)} style={{ display: 'block', padding: '8px 6px' }}>Dashboard</Link></li>
                  <li>
                    <button onClick={handleLogout} className="btn-link" style={{ display: 'block', padding: '8px 6px', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                      Logout
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

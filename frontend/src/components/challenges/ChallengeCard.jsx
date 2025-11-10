// TODO: Implement challenge card component
import React, { useState } from 'react';

const difficultyStyles = {
  easy: { label: 'Easy', color: '#2ecc71' },
  medium: { label: 'Medium', color: '#f1c40f' },
  hard: { label: 'Hard', color: '#e74c3c' },
};

const truncate = (text = '', length = 160) =>
  text.length > length ? `${text.slice(0, length).trim()}…` : text;

const ChallengeCard = ({ challenge = {}, onStart, onSave, onShare, onView }) => {
  const [saved, setSaved] = useState(false);

  const {
    id,
    title = 'Untitled Challenge',
    description = '',
    difficulty = 'medium',
    points = 10,
    estimatedTime, // minutes
    tags = [],
    progress, // optional percent
  } = challenge;

  const diffKey = (String(difficulty).toLowerCase() in difficultyStyles)
    ? String(difficulty).toLowerCase()
    : 'medium';
  const diff = difficultyStyles[diffKey];

  const handleStart = () => {
    if (typeof onStart === 'function') return onStart(challenge);
    // default: navigate to challenge page if available
    window.location.href = `/challenges/${id}`;
  };

  const handleSave = async () => {
    const next = !saved;
    setSaved(next);
    if (typeof onSave === 'function') return onSave({ challenge, saved: next });
    // default: optimistic UI only
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/challenges/${id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, url, text: truncate(description, 120) });
        if (typeof onShare === 'function') return onShare({ challenge, method: 'web-share' });
      } catch (err) {
        // ignore user cancel
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        if (typeof onShare === 'function') onShare({ challenge, method: 'clipboard' });
        // tiny UI hint could be added; omitted to keep component stateless-ish
      } catch (err) {
        // fallback no-op
      }
    }
  };

  const handleView = () => {
    if (typeof onView === 'function') return onView(challenge);
    window.location.href = `/challenges/${id}`;
  };

  return (
    <article className="challenge-card" aria-labelledby={`challenge-title-${id}`}>
      <header className="challenge-header">
        <div className="title-wrap">
          <h3 id={`challenge-title-${id}`} className="challenge-title">{title}</h3>

          <div
            className="difficulty-badge"
            title={`Difficulty: ${diff.label}`}
            style={{
              backgroundColor: diff.color,
              color: '#fff',
              padding: '4px 8px',
              borderRadius: 999,
              fontSize: 12,
              display: 'inline-block',
              marginLeft: 8,
            }}
            aria-hidden="true"
          >
            {diff.label}
          </div>
        </div>

        <div className="meta-wrap" aria-hidden="true">
          <span className="points">+{points} pts</span>
          {typeof estimatedTime !== 'undefined' && (
            <span className="estimated-time">⏱ {estimatedTime} min</span>
          )}
        </div>
      </header>

      <div className="challenge-content">
        <p className="challenge-description">{truncate(description, 180)}</p>

        {tags && tags.length > 0 && (
          <div className="challenge-tags" aria-label="challenge-tags">
            {tags.map((t, i) => (
              <span key={i} className="tag">#{t}</span>
            ))}
          </div>
        )}

        {typeof progress === 'number' && (
          <div className="progress-row" aria-hidden="true">
            <div className="progress-label">Progress</div>
            <div className="progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress}>
              <div className="progress-fill" style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
            </div>
            <div className="progress-percent">{progress}%</div>
          </div>
        )}
      </div>

      <footer className="challenge-footer">
        <div className="actions-left">
          <button className="btn-primary" onClick={handleStart} aria-label={`Start ${title}`}>
            ▶ Start
          </button>

          <button
            className={`btn-ghost ${saved ? 'saved' : ''}`}
            onClick={handleSave}
            aria-pressed={saved}
            aria-label={saved ? 'Saved' : 'Save challenge'}
            title={saved ? 'Saved' : 'Save challenge'}
          >
            {saved ? 'Saved' : 'Save'}
          </button>
        </div>

        <div className="actions-right">
          <button className="btn-icon" onClick={handleShare} aria-label="Share challenge">🔗</button>
          <button className="btn-link" onClick={handleView} aria-label="View details">Details</button>
        </div>
      </footer>
    </article>
  );
};

export default ChallengeCard;

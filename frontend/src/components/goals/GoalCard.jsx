// TODO: Implement goal card component
import React, { useState } from 'react';
import PropTypes from 'prop-types';


const clamp = (v) => Math.max(0, Math.min(100, Number(v) || 0));
const formatDate = (iso) => {
  if (!iso) return '';
  try { return new Date(iso).toLocaleDateString(); } catch { return iso; }
};

const GoalCard = ({ goal = {}, onEdit, onDelete, onToggleComplete, onUpdateProgress }) => {
  const initial = clamp(goal.progress);
  const [progress, setProgress] = useState(initial);
  const [busy, setBusy] = useState(false);

  const completed = !!goal.isCompleted || progress >= 100;
  const statusLabel = completed
    ? 'Completed'
    : progress >= 75 ? 'On track' : progress >= 40 ? 'In progress' : 'Just started';

  const updateProgress = async (next) => {
    const p = clamp(next);
    setProgress(p);
    if (typeof onUpdateProgress === 'function') {
      setBusy(true);
      try { await onUpdateProgress(goal, { progress: p }); } finally { setBusy(false); }
    }
  };

  const handleQuickAdd = (amount) => {
    if (completed) return;
    updateProgress(progress + Number(amount));
  };

  const handleToggleComplete = async () => {
    if (typeof onToggleComplete !== 'function') return;
    setBusy(true);
    try {
      const nextComplete = !completed;
      // optimistic update
      setProgress(nextComplete ? 100 : Math.min(99, progress));
      await onToggleComplete(goal, nextComplete);
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="goal-card" style={{ border: '1px solid #e6e6e6', borderRadius: 8, padding: 12, background: '#fff' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h3 style={{ margin: 0 }}>{goal.title || 'Untitled Goal'}</h3>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>
            <span>{goal.category || 'General'}</span>
            {goal.targetDate && <span style={{ marginLeft: 8 }}>• Due: {formatDate(goal.targetDate)}</span>}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: completed ? '#10b981' : '#374151' }}>{statusLabel}</div>
          <div style={{ fontSize: 12, color: '#374151' }}>{completed ? 'Completed' : `${progress}%`}</div>
        </div>
      </header>

      <section style={{ marginTop: 12 }}>
        <p style={{ margin: 0, color: '#374151' }}>{goal.description || 'No description provided.'}</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
          <div role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress}
               style={{ flex: 1, height: 10, background: '#f3f4f6', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: completed ? '#10b981' : '#3b82f6',
              transition: 'width 220ms ease'
            }} />
          </div>
          <div style={{ minWidth: 44, textAlign: 'right', fontSize: 12 }}>{progress}%</div>
        </div>

        {Array.isArray(goal.tags) && goal.tags.length > 0 && (
          <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {goal.tags.map((t, i) => <span key={i} style={{ background: '#f3f4f6', padding: '4px 8px', borderRadius: 999, fontSize: 12 }}>#{t}</span>)}
          </div>
        )}
      </section>

      <footer style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-primary" onClick={() => handleQuickAdd(5)} disabled={busy || completed} title="Quick add 5%">+5%</button>
          <button className="btn-ghost" onClick={() => handleQuickAdd(10)} disabled={busy || completed} title="Quick add 10%">+10%</button>
          <button className="btn-outline" onClick={() => typeof onEdit === 'function' && onEdit(goal)} title="Edit goal">Edit</button>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`btn-${completed ? 'success' : 'primary'}`} onClick={handleToggleComplete} disabled={busy} aria-pressed={completed}>
            {busy ? 'Updating…' : (completed ? 'Undo' : 'Mark Complete')}
          </button>
          <button className="btn-danger" onClick={() => typeof onDelete === 'function' && onDelete(goal)} title="Delete goal">Delete</button>
        </div>
      </footer>
    </article>
  );
};

GoalCard.propTypes = {
  goal: PropTypes.object,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onToggleComplete: PropTypes.func,
  onUpdateProgress: PropTypes.func,
};

export default GoalCard;

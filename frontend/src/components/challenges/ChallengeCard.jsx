import React, { useState } from 'react';
import { apiService } from '../../services/api';
import '../../styles/components/challenges/ChallengeCard.scss';

const ChallengeCard = ({ challenge }) => {
  const [removed, setRemoved] = useState(false);

  if (removed) return null;

  const difficulty = (
    challenge?.difficulty ||
    challenge?.difficulty_level ||
    'medium'
  ).toString();
  const points = challenge?.points_reward ?? challenge?.points ?? 10;
  const estimated =
    challenge?.estimated_time_minutes ?? challenge?.estimatedTime ?? null;

  return (
    <div className="challenge-card">
      <div className="challenge-header">
        <h3>{challenge?.title || 'Challenge Title'}</h3>
        <div className="challenge-meta">
          <span className="difficulty">
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </span>
          <span className="points">+{points} pts</span>
          {(challenge?.is_completed ||
            challenge?.completed ||
            challenge?.status === 'completed') && (
            <span className="badge badge-completed">Completed</span>
          )}
        </div>
      </div>

      <div className="challenge-content">
        <p>{challenge?.description || 'Challenge description goes here...'}</p>

        {estimated && (
          <div className="estimated-time">
            <span>⏱️ {estimated} min</span>
          </div>
        )}

        {challenge?.tags && (
          <div className="challenge-tags">
            {challenge.tags.map((tag, index) => (
              <span key={index} className="tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="challenge-footer">
        <div className="primary-actions">
          <button
            className="btn-primary"
            onClick={() =>
              window.location.assign(`/challenges/${challenge.id}`)
            }
          >
            Start Challenge
          </button>

          <MarkCompleteButton
            challengeId={challenge.id}
            initiallyDone={Boolean(
              challenge?.is_completed ||
                challenge?.completed ||
                challenge?.status === 'completed'
            )}
          />
        </div>

        <div className="delete-row">
          <DeleteChallengeButton
            challengeId={challenge.id}
            onDeleted={() => setRemoved(true)}
          />
        </div>
      </div>
    </div>
  );
};

const MarkCompleteButton = ({ challengeId, initiallyDone = false }) => {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(Boolean(initiallyDone));

  const handleMark = async () => {
    if (loading || done) return;
    setLoading(true);
    try {
      await apiService.submissions.markComplete(challengeId);
      window.dispatchEvent(
        new CustomEvent('challenge:completed', { detail: { challengeId } })
      );
      setDone(true);
    } catch (err) {
      console.error('Failed to mark challenge complete', err);
      alert(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to mark complete'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className="btn-secondary"
      onClick={handleMark}
      disabled={loading || done}
      title={done ? 'Completed' : 'Mark this challenge as complete'}
    >
      {done ? 'Completed' : loading ? 'Marking...' : 'Mark Complete'}
    </button>
  );
};

const DeleteChallengeButton = ({ challengeId, onDeleted }) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!challengeId) return;
    const ok = window.confirm(
      'Delete this challenge? This action cannot be undone.'
    );
    if (!ok) return;
    setLoading(true);
    try {
      await apiService.challenges.delete(challengeId);
      window.dispatchEvent(
        new CustomEvent('challenge:deleted', { detail: { challengeId } })
      );
      if (window.location.pathname.includes(`/challenges/${challengeId}`)) {
        window.location.href = '/challenges';
      }
      if (onDeleted) onDeleted();
    } catch (err) {
      console.error('Failed to delete challenge', err);
      alert(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to delete challenge'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className="btn-danger"
      onClick={handleDelete}
      disabled={loading}
      title={loading ? 'Deleting...' : 'Delete challenge'}
    >
      {loading ? 'Deleting...' : 'Delete'}
    </button>
  );
};

export default ChallengeCard;

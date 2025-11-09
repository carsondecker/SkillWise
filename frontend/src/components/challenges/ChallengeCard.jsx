// TODO: Implement challenge card component
import React, { useState } from 'react';
import { apiService } from '../../services/api';
import '../../styles/components/challenges/ChallengeCard.scss';

const ChallengeCard = ({ challenge }) => {
  // TODO: Add difficulty indicators, estimated time, tags, actions
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
        <button
          className="btn-primary"
          onClick={() => window.location.assign(`/challenges/${challenge.id}`)}
        >
          Start Challenge
        </button>

        {/* Mark complete quickly without submission */}
        <MarkCompleteButton
          challengeId={challenge.id}
          initiallyDone={Boolean(
            challenge?.is_completed ||
              challenge?.completed ||
              challenge?.status === 'completed'
          )}
        />
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
      // let other parts of the app refresh (goal cards, leaderboard)
      window.dispatchEvent(
        new CustomEvent('challenge:completed', { detail: { challengeId } })
      );
      setDone(true);
    } catch (err) {
      console.error('Failed to mark challenge complete', err);
      // Basic user feedback — ideally replace with toast
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

export default ChallengeCard;

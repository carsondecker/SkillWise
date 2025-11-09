// TODO: Implement challenge card component
import React from 'react';

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
        <button className="btn-primary">Start Challenge</button>
      </div>
    </div>
  );
};

export default ChallengeCard;

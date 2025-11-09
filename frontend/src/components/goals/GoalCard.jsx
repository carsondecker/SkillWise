// TODO: Implement goal card component
import React, { useState } from 'react';
import Modal from '../ui/Modal';
import ChallengeForm from '../challenges/ChallengeForm';
import { useNavigate } from 'react-router-dom';
import ProgressBar from '../common/ProgressBar';
import '../../styles/components/goals/GoalCard.scss';

const GoalCard = ({ goal }) => {
  // TODO: Add progress bar, completion status, actions
  const formatCategory = (c) => {
    if (!c) return 'Category';
    // handle values like 'data-science', 'data science', 'Data Science', 'programming'
    return c
      .toString()
      .replace(/[-_]+/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  };

  // Normalize backend fields (snake_case) to frontend-friendly keys
  const normalizedGoal = {
    id: goal?.id,
    title: goal?.title || goal?.name || '',
    description: goal?.description || goal?.desc || '',
    category: goal?.category || goal?.category_name || '',
    difficulty: goal?.difficulty || goal?.difficulty_level || 'Medium',
    targetDate:
      goal?.targetDate ||
      goal?.target_completion_date ||
      goal?.target_date ||
      null,
    progress:
      goal?.progress ??
      goal?.progress_percentage ??
      goal?.completion ??
      goal?.progressPercent ??
      goal?.progress_percent ??
      0,
    challenges: Array.isArray(goal?.challenges)
      ? goal.challenges
      : goal?.linked_challenges || [],
    raw: goal,
  };

  if (process.env.NODE_ENV === 'development') {
    // Helpful debug: show normalized goal shape when cards are not rendering
    // so developers can spot mismatches quickly.
    // eslint-disable-next-line no-console
    console.debug('[GoalCard] normalized goal:', normalizedGoal);
  }

  const displayCategory = formatCategory(normalizedGoal.category);

  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();

  const openCreateFromGoal = () => setShowCreate(true);
  const closeCreateFromGoal = () => setShowCreate(false);

  const handleCreated = (created) => {
    // Close modal and navigate to challenges list (or specific challenge if returned)
    closeCreateFromGoal();
    if (created && created.id) {
      navigate(`/challenges`);
    } else {
      navigate('/challenges');
    }
  };

  return (
    <>
      <div className="goal-card">
        <div className="goal-header">
          <h3>{normalizedGoal.title || 'Goal Title'}</h3>
          <span className="goal-category">{displayCategory}</span>
        </div>

        <div className="goal-content">
          <p>{normalizedGoal.description || 'Goal description goes here...'}</p>

          <div className="goal-progress">
            {(() => {
              // Resolve progress from multiple possible backend fields, or compute from linked challenges
              const raw = normalizedGoal.progress || 0;

              // If there is no explicit percent but we have challenges, compute by completed / total
              const computeFromChallenges = () => {
                const ch = Array.isArray(normalizedGoal.challenges)
                  ? normalizedGoal.challenges
                  : [];
                if (ch.length === 0) return null;
                const completed = ch.filter(
                  (c) =>
                    c?.status === 'completed' || c?.is_completed || c?.completed
                ).length;
                return Math.round((completed / ch.length) * 100);
              };

              let pct = Number(raw || 0);
              if (!pct || Number.isNaN(pct)) {
                const fromCh = computeFromChallenges();
                pct = fromCh != null ? fromCh : 0;
              }

              // Clamp and ensure integer
              pct = Math.max(0, Math.min(100, Math.round(pct)));

              return <ProgressBar value={pct} label="Progress" />;
            })()}
          </div>
        </div>

        <div className="goal-footer">
          <span className="goal-difficulty">
            {normalizedGoal.difficulty || 'Medium'}
          </span>
          {normalizedGoal.targetDate && (
            <span className="goal-date">Due: {normalizedGoal.targetDate}</span>
          )}
          <div className="goal-actions">
            <button className="btn-secondary" onClick={openCreateFromGoal}>
              Create Challenge from Goal
            </button>
          </div>
        </div>
      </div>

      {showCreate && (
        <Modal
          isOpen={showCreate}
          onClose={closeCreateFromGoal}
          title="Create Challenge from Goal"
        >
          <ChallengeForm
            initialData={{
              title: normalizedGoal.title
                ? `Challenge: ${normalizedGoal.title}`
                : '',
              description: normalizedGoal.description || '',
              instructions: normalizedGoal.description || '',
              category: normalizedGoal.category || '',
              goalId: normalizedGoal.id,
            }}
            onCancel={closeCreateFromGoal}
            onCreated={handleCreated}
          />
        </Modal>
      )}
    </>
  );
};

export default GoalCard;

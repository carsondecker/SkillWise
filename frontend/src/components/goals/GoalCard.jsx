// TODO: Implement goal card component
import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import ChallengeForm from '../challenges/ChallengeForm';
import { useNavigate } from 'react-router-dom';
import ProgressBar from '../common/ProgressBar';
import '../../styles/components/goals/GoalCard.scss';
import { apiService } from '../../services/api';

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
  const [removed, setRemoved] = useState(false);

  // Local list of challenges tied to this goal (fetched from /api/challenges)
  const [goalChallenges, setGoalChallenges] = useState(
    Array.isArray(normalizedGoal.challenges) && normalizedGoal.challenges.length
      ? normalizedGoal.challenges
      : []
  );

  const openCreateFromGoal = () => setShowCreate(true);
  const closeCreateFromGoal = () => setShowCreate(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteGoal = async () => {
    if (!normalizedGoal.id) return;
    const ok = window.confirm(
      `Delete goal "${normalizedGoal.title}"? This action cannot be undone.`
    );
    if (!ok) return;
    setDeleting(true);
    try {
      await apiService.goals.delete(normalizedGoal.id);
      // Notify other parts of the app and navigate to goals list
      window.dispatchEvent(
        new CustomEvent('goal:deleted', { detail: { id: normalizedGoal.id } })
      );
      // remove immediately from view
      setRemoved(true);
      // navigate back to goals list if not already there
      if (window.location.pathname !== '/goals') navigate('/goals');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to delete goal', err);
      alert(
        err?.response?.data?.message || err?.message || 'Failed to delete goal'
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleCreated = (created) => {
    // Close modal and navigate to challenges list (or specific challenge if returned)
    closeCreateFromGoal();
    if (created && created.id) {
      navigate(`/challenges`);
    } else {
      navigate('/challenges');
    }
  };

  // Fetch challenges for this goal from the API and filter by related_goal_id.
  // We prefer the server response because it will include `is_completed` for
  // the authenticated user (when the client sends the access token).
  useEffect(() => {
    let mounted = true;

    const fetchChallenges = async () => {
      if (!normalizedGoal.id) return setGoalChallenges([]);
      try {
        const res = await apiService.challenges.getAll();
        const all = res.data.challenges || [];
        console.log(all);
        const related = all.filter((c) => {
          // Accept either camelCase or snake_case field names coming from server
          const relatedId = c.related_goal_id ?? c.relatedGoalId ?? c.goal_id;
          return (
            relatedId !== undefined &&
            relatedId !== null &&
            Number(relatedId) === Number(normalizedGoal.id)
          );
        });
        if (mounted) setGoalChallenges(related);
      } catch (err) {
        // Non-fatal — keep showing whatever challenges were included in the goal payload
        // eslint-disable-next-line no-console
        console.error('[GoalCard] failed to load challenges for goal', err);
      }
    };

    fetchChallenges();

    // Refresh if a challenge is completed elsewhere in the app
    const onComplete = (e) => {
      // e.detail.challengeId may be present — simply refetch list
      fetchChallenges();
    };

    window.addEventListener('challenge:completed', onComplete);

    return () => {
      mounted = false;
      window.removeEventListener('challenge:completed', onComplete);
    };
  }, [normalizedGoal.id]);

  if (removed) return null;

  return (
    <div className="goal-card-wrapper">
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
              // Compute progress strictly from linked challenges per spec:
              // - If there are no challenges linked to this goal -> 0%
              // - Otherwise compute completed / total * 100 using completed and uncompleted challenges
              const ch =
                Array.isArray(goalChallenges) && goalChallenges.length > 0
                  ? goalChallenges.filter(Boolean)
                  : Array.isArray(normalizedGoal.challenges)
                  ? normalizedGoal.challenges.filter(Boolean)
                  : [];

              if (ch.length === 0) {
                return <ProgressBar value={0} label="Progress" />;
              }

              const total =
                ch.filter((c) => c && (c.id || c.id === 0)).length || ch.length;
              // Determine completion using backend-provided `is_completed` when available,
              // otherwise fall back to common fields/status values.
              const completed = ch.filter((c) => {
                if (!c) return false;
                if (typeof c.is_completed === 'boolean') return c.is_completed;
                if (typeof c.completed === 'boolean') return c.completed;
                const status = (c.status || '').toString().toLowerCase();
                return status === 'completed' || status === 'graded';
              }).length;

              const pct = Math.max(
                0,
                Math.min(100, Math.round((completed / total) * 100))
              );

              return <ProgressBar value={pct} label="Progress" />;
            })()}
          </div>

          <div className="goal-footer">
            <span className="goal-difficulty">
              {normalizedGoal.difficulty || 'Medium'}
            </span>
            {normalizedGoal.targetDate && (
              <span className="goal-date">
                Due: {normalizedGoal.targetDate}
              </span>
            )}
            <div className="goal-actions">
              <button className="btn-secondary" onClick={openCreateFromGoal}>
                Create Challenge from Goal
              </button>
              <button
                className="btn-danger"
                onClick={handleDeleteGoal}
                disabled={deleting}
                title={deleting ? 'Deleting...' : 'Delete goal'}
              >
                {deleting ? 'Deleting...' : 'Delete Goal'}
              </button>
            </div>
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
    </div>
  );
};

export default GoalCard;

import React, { useState } from 'react';
import { apiService } from '../../services/api';
import '../../styles/components/challenges/ChallengeForm.scss';

const defaultCategories = [
  { value: '', label: 'Select category' },
  { value: 'programming', label: 'Programming' },
  { value: 'design', label: 'Design' },
  { value: 'backend', label: 'Backend' },
  { value: 'data-science', label: 'Data Science' },
  { value: 'business', label: 'Business' },
];

const ChallengeForm = ({ onCreated, onCancel, initialData = {} }) => {
  const [title, setTitle] = useState(initialData.title || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [instructions, setInstructions] = useState(
    initialData.instructions || ''
  );
  const [category, setCategory] = useState(initialData.category || '');
  const [difficulty, setDifficulty] = useState('medium');
  const [points, setPoints] = useState(10);
  const [estimated, setEstimated] = useState('');
  const [requiresPeerReview, setRequiresPeerReview] = useState(false);
  const [tags, setTags] = useState('');
  const [learningObjectives, setLearningObjectives] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // AI options placeholders (will be ignored if backend not implemented)
  const [aiSuggest, setAiSuggest] = useState(false);
  const [aiPromptVariant, setAiPromptVariant] = useState('draft');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !instructions.trim()) {
      setError('Please fill title, description and instructions');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        instructions: instructions.trim(),
        category: category || null,
        difficulty_level: difficulty,
        points_reward: Number(points) || 10,
        estimated_time_minutes: estimated ? Number(estimated) : null,
        requires_peer_review: requiresPeerReview,
        tags: tags
          ? tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
        learning_objectives: learningObjectives
          ? learningObjectives
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
        // AI options (front-end-only for now) — backend may ignore unknown fields
        ai_suggest: aiSuggest,
        ai_prompt_variant: aiPromptVariant,
      };
      // If initialData contains a related goal id, include it so backend can link the challenge
      if (initialData.related_goal_id || initialData.goalId) {
        payload.related_goal_id =
          initialData.related_goal_id || initialData.goalId;
      }

      const res = await apiService.challenges.create(payload);
      const created = res.data?.challenge || res.data || null;
      if (onCreated) onCreated(created);
    } catch (err) {
      console.error('Failed to create challenge', err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to create challenge'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="challenge-form" onSubmit={handleSubmit}>
      {error && <div className="form-error">{error}</div>}

      <label>
        Title
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </label>

      <label>
        Description
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          required
        />
      </label>

      <label>
        Instructions
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={6}
          required
        />
      </label>

      <div className="row">
        <label>
          Category
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {defaultCategories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Difficulty
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </label>
      </div>

      <div className="row">
        <label>
          Points
          <input
            type="number"
            min={0}
            value={points}
            onChange={(e) => setPoints(e.target.value)}
          />
        </label>

        <label>
          Estimated minutes
          <input
            type="number"
            min={1}
            value={estimated}
            onChange={(e) => setEstimated(e.target.value)}
          />
        </label>
      </div>

      <label>
        Tags (comma separated)
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="express,node,backend"
        />
      </label>

      <label>
        Learning objectives (comma separated)
        <input
          value={learningObjectives}
          onChange={(e) => setLearningObjectives(e.target.value)}
          placeholder="Understand REST,Work with Postgres"
        />
      </label>

      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={requiresPeerReview}
          onChange={(e) => setRequiresPeerReview(e.target.checked)}
        />{' '}
        Requires peer review
      </label>

      {/* AI options (UI-only for now) */}
      <div className="ai-options">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={aiSuggest}
            onChange={(e) => setAiSuggest(e.target.checked)}
          />{' '}
          Use AI to suggest challenge content (optional)
        </label>
        {aiSuggest && (
          <label>
            Prompt variant
            <select
              value={aiPromptVariant}
              onChange={(e) => setAiPromptVariant(e.target.value)}
            >
              <option value="draft">Draft challenge</option>
              <option value="detailed">Detailed with rubric</option>
            </select>
          </label>
        )}
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="btn-secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Creating...' : 'Create Challenge'}
        </button>
      </div>
    </form>
  );
};

export default ChallengeForm;

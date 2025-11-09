import React, { useState } from 'react';
import { apiService } from '../../services/api';
import '../../styles/components/goals/GoalForm.scss';

const defaultCategories = [
  { value: '', label: 'Select category' },
  { value: 'programming', label: 'Programming' },
  { value: 'design', label: 'Design' },
  { value: 'business', label: 'Business' },
];

const GoalForm = ({ onCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Match server expected field names: difficulty_level and target_completion_date
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category: category || null,
        target_completion_date: targetDate || null,
        difficulty_level: difficulty || 'medium',
      };

      const res = await apiService.goals.create(payload);
      const created = res.data?.goal || res.data || null;
      if (onCreated) onCreated(created);
    } catch (err) {
      console.error('Failed to create goal', err);
      setError(err?.message || 'Failed to create goal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="goal-form" onSubmit={handleSubmit}>
      {error && <div className="form-error">{error}</div>}

      <label>
        Title
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What do you want to learn?"
          required
        />
      </label>

      <label>
        Description
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the goal and why it matters"
          rows={4}
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
          Target date
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />
        </label>
      </div>

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

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Creating...' : 'Create Goal'}
        </button>
      </div>
    </form>
  );
};

export default GoalForm;

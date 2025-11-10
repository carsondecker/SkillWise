import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { motion } from 'framer-motion';
import { validateChallengeUpdate } from '../../validation/challengeValidation';
import { validateChallenge } from '../../validation/challengeValidation';
import { apiService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/components/Challenge/ChallengeModal.scss';

const ChallengeModal = forwardRef(({ onClose, onCreatedOrUpdated }, ref) => {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    instructions: '',
    category: '',
    difficulty_level: 'medium',
    points_reward: 10,
    estimated_time_minutes: 30,
    max_attempts: 3,
    requires_peer_review: false,
    is_active: true,
    prerequisites: '',
    tags: '',
    learning_objectives: '',
  });

  // 👇 Expose prefill function to parent (for edit mode)
  useImperativeHandle(ref, () => ({
    prefillForm(challenge) {
      setForm({
        ...challenge,
        id: challenge.id,
        tags: Array.isArray(challenge.tags)
          ? challenge.tags.join(', ')
          : challenge.tags || '',
        learning_objectives: Array.isArray(challenge.learning_objectives)
          ? challenge.learning_objectives.join(', ')
          : challenge.learning_objectives || '',
        prerequisites: Array.isArray(challenge.prerequisites)
          ? challenge.prerequisites.join(', ')
          : challenge.prerequisites || '',
      });
    },
  }));

  // 🧠 Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBoolChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value === 'true' }));
  };

  // 🧩 Submit handler (create or update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const validation = form.id
        ? validateChallengeUpdate(form)
        : validateChallenge(form);

      if (!validation.success) {
        alert(validation.error);
        return;
      }

      // ✅ Convert string inputs safely to numbers
      const payload = {
        ...validation.data,
        created_by: user?.id,
        points_reward: Number(form.points_reward) || 0,
        estimated_time_minutes: Number(form.estimated_time_minutes) || 0,
        max_attempts: Number(form.max_attempts) || 1,
        requires_peer_review: !!form.requires_peer_review,
        is_active: !!form.is_active,
        tags: form.tags
          ? form.tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
        learning_objectives: form.learning_objectives
          ? form.learning_objectives
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
        prerequisites: form.prerequisites
          ? form.prerequisites
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
      };

      let response;
      if (form.id) {
        response = await apiService.challenges.update(form.id, payload);
      } else {
        response = await apiService.challenges.create(payload);
      }

      const result = response.data.challenge || response.data;
      onCreatedOrUpdated(result);
      onClose();
    } catch (error) {
      console.error('❌ Failed to save challenge:', error);
      alert('Failed to save challenge. Check console for details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) =>
        e.target.classList.contains('modal-backdrop') && onClose()
      }
    >
      <motion.div
        className="modal"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.25 }}
      >
        <h2>{form.id ? '✏️ Edit Challenge' : '🆕 Create Challenge'}</h2>

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div className="form-group">
            <label>Title</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              required
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              rows="3"
              value={form.description}
              onChange={handleChange}
              required
            />
          </div>

          {/* Instructions */}
          <div className="form-group">
            <label>Instructions</label>
            <textarea
              name="instructions"
              rows="2"
              value={form.instructions}
              onChange={handleChange}
            />
          </div>

          {/* Category + Difficulty */}
          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                required
              >
                <option value="">Select Category</option>
                <option value="programming">Programming</option>
                <option value="design">Design</option>
                <option value="backend">Backend</option>
                <option value="data-science">Data Science</option>
                <option value="business">Business</option>
              </select>
            </div>

            <div className="form-group">
              <label>Difficulty</label>
              <select
                name="difficulty_level"
                value={form.difficulty_level}
                onChange={handleChange}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Points + Time */}
          <div className="form-row">
            <div className="form-group">
              <label>Points Reward</label>
              <input
                type="number"
                name="points_reward"
                value={form.points_reward}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Estimated Time (min)</label>
              <input
                type="number"
                name="estimated_time_minutes"
                value={form.estimated_time_minutes}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Attempts + Peer Review */}
          <div className="form-row">
            <div className="form-group">
              <label>Max Attempts</label>
              <input
                type="number"
                name="max_attempts"
                value={form.max_attempts}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Requires Peer Review?</label>
              <select
                name="requires_peer_review"
                value={form.requires_peer_review ? 'true' : 'false'}
                onChange={(e) =>
                  handleBoolChange('requires_peer_review', e.target.value)
                }
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>
          </div>

          {/* Active + Prerequisites */}
          <div className="form-row">
            <div className="form-group">
              <label>Active Status</label>
              <select
                name="is_active"
                value={form.is_active ? 'true' : 'false'}
                onChange={(e) => handleBoolChange('is_active', e.target.value)}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            <div className="form-group">
              <label>Prerequisites (comma-separated)</label>
              <input
                name="prerequisites"
                value={form.prerequisites}
                onChange={handleChange}
                placeholder="e.g., HTML Basics, JS Arrays"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="form-group">
            <label>Tags (comma-separated)</label>
            <input name="tags" value={form.tags} onChange={handleChange} />
          </div>

          {/* Learning Objectives */}
          <div className="form-group">
            <label>Learning Objectives (comma-separated)</label>
            <input
              name="learning_objectives"
              value={form.learning_objectives}
              onChange={handleChange}
            />
          </div>

          {/* Buttons */}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting
                ? 'Saving...'
                : form.id
                ? 'Save Changes'
                : 'Create Challenge'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
});

export default ChallengeModal;

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import GoalCard from '../components/goals/GoalCard';
import { apiService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import '../styles/GoalsPage.scss';

const GoalsPage = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [filteredGoals, setFilteredGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: '',
    difficulty: 'medium',
    target_date: '',
    progress: 0,
    is_public: false,
  });

  // 🔹 Fetch all goals
  useEffect(() => {
    const fetchGoals = async () => {
      try {
        setLoading(true);
        const res = await apiService.goals.getAll();
        const fetchedGoals = Array.isArray(res.data)
          ? res.data
          : res.data?.goals || [];
        setGoals(fetchedGoals);
        console.log(fetchedGoals);
        setFilteredGoals(fetchedGoals);
      } catch (err) {
        console.error('Failed to fetch goals:', err);
        setGoals([]);
        setFilteredGoals([]);
      } finally {
        setLoading(false);
      }
    };
    void fetchGoals();
  }, []);

  // 🔹 Filter + Search Logic
  useEffect(() => {
    let filtered = [...goals];
    if (category) filtered = filtered.filter((g) => g.category === category);
    if (searchTerm)
      filtered = filtered.filter((g) =>
        g.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    setFilteredGoals(filtered);
  }, [category, searchTerm, goals]);

  // 🔹 Input handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewGoal((prev) => ({ ...prev, [name]: value }));
  };

  const handleBoolChange = (e) => {
    const { name, value } = e.target;
    setNewGoal((prev) => ({ ...prev, [name]: value === 'true' }));
  };

  // 🔹 Create goal
  const handleCreateGoal = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      const payload = {
        title: newGoal.title.trim(),
        description: newGoal.description.trim(),
        category: newGoal.category,
        difficulty_level: newGoal.difficulty,
        target_date: newGoal.target_date
          ? new Date(newGoal.target_date).toISOString()
          : null,
        is_public: !!newGoal.is_public,
      };

      const res = await apiService.goals.create(payload);
      const created = res.data.goal || res.data;

      setGoals((prev) => [created, ...prev]);
      setFilteredGoals((prev) => [created, ...prev]);
      setShowModal(false);

      // Reset form
      setNewGoal({
        title: '',
        description: '',
        category: '',
        difficulty: 'medium',
        target_date: '',
        progress: 0,
        is_public: false,
      });
    } catch (error) {
      console.error('❌ Failed to create goal:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleRefreshGoals = async () => {
    try {
      setLoading(true);
      const res = await apiService.goals.getAll();
      const fetchedGoals = Array.isArray(res.data)
        ? res.data
        : res.data?.goals || [];
      setGoals(fetchedGoals);
      setFilteredGoals(fetchedGoals);
    } catch (err) {
      console.error('Failed to refresh goals:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="goals-page" id="goals-page">
      <div className="page-header" id="goals-header">
        <div className="header-left">
          <h1 id="goals-title">🎯 My Learning Goals</h1>
          <p id="goals-subtitle">Track your skills, milestones, and progress effortlessly.</p>
        </div>
        <motion.button
          id="create-goal-btn"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          className="btn-primary"
          onClick={() => setShowModal(true)}
        >
          + Create New Goal
        </motion.button>
      </div>

      <div className="goals-controls" id="goals-controls">
        <input
          id="goal-search"
          type="text"
          placeholder="Search goals..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select
          id="goal-filter-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="programming">Programming</option>
          <option value="design">Design</option>
          <option value="business">Business</option>
          <option value="language">Language</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-state" id="loading-state">
          <p>Loading your goals...</p>
        </div>
      ) : filteredGoals.length > 0 ? (
        <div className="goals-grid" id="goals-grid">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onUpdated={() => handleRefreshGoals()}
              onDeleted={(id) =>
                setGoals((prev) => prev.filter((g) => g.id !== id))
              }
            />
          ))}
        </div>
      ) : (
        <div className="empty-state" id="empty-state">
          <p>No goals found. Let’s start your learning journey!</p>
        </div>
      )}

      {/* ✅ Create Goal Modal */}
      {showModal && (
        <div
          className="modal-backdrop"
          id="goal-modal-backdrop"
          onClick={(e) =>
            e.target.classList.contains('modal-backdrop') && setShowModal(false)
          }
        >
          <motion.div
            id="goal-modal"
            className="modal"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <h2 id="goal-modal-title">Create New Goal</h2>
            <form id="create-goal-form" onSubmit={handleCreateGoal}>
              <div className="form-group">
                <label htmlFor="goal-title">Title</label>
                <input
                  id="goal-title"
                  name="title"
                  value={newGoal.title}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="goal-description">Description</label>
                <textarea
                  id="goal-description"
                  name="description"
                  rows="3"
                  value={newGoal.description}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="goal-category">Category</label>
                  <select
                    id="goal-category"
                    name="category"
                    value={newGoal.category}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="programming">Programming</option>
                    <option value="design">Design</option>
                    <option value="business">Business</option>
                    <option value="language">Language</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="goal-difficulty">Difficulty</label>
                  <select
                    id="goal-difficulty"
                    name="difficulty"
                    value={newGoal.difficulty}
                    onChange={handleInputChange}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="goal-target-date">Target Date</label>
                <input
                  id="goal-target-date"
                  type="date"
                  name="target_date"
                  value={newGoal.target_date}
                  onChange={handleInputChange}
                />
              </div>

              {/* 🧩 Points Reward + Public Toggle */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="goal-visibility">Visibility</label>
                  <select
                    id="goal-visibility"
                    name="is_public"
                    value={newGoal.is_public ? 'true' : 'false'}
                    onChange={handleBoolChange}
                  >
                    <option value="false">Private</option>
                    <option value="true">Public</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions" id="goal-modal-actions">
                <button
                  id="cancel-goal"
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  id="submit-goal"
                  type="submit"
                  className="btn-primary"
                  disabled={creating}
                >
                  {creating ? 'Creating...' : 'Create Goal'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default GoalsPage;

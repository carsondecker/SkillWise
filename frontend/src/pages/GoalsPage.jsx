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
        setFilteredGoals(fetchedGoals);
      } catch (err) {
        console.error('Failed to fetch goals:', err);
        setGoals([]);
        setFilteredGoals([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();
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
      });
    } catch (error) {
      console.error('❌ Failed to create goal:', error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="goals-page">
      <div className="page-header">
        <div className="header-left">
          <h1>🎯 My Learning Goals</h1>
          <p>Track your skills, milestones, and progress effortlessly.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          className="btn-primary"
          onClick={() => setShowModal(true)}
        >
          + Create New Goal
        </motion.button>
      </div>

      <div className="goals-controls">
        <input
          type="text"
          placeholder="Search goals..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          <option value="programming">Programming</option>
          <option value="design">Design</option>
          <option value="business">Business</option>
          <option value="language">Language</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-state">
          <p>Loading your goals...</p>
        </div>
      ) : filteredGoals.length > 0 ? (
        <div className="goals-grid">
          {filteredGoals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>No goals found. Let’s start your learning journey!</p>
        </div>
      )}

      {/* ✅ Create Goal Modal */}
      {showModal && (
        <div
          className="modal-backdrop"
          onClick={(e) =>
            e.target.classList.contains('modal-backdrop') && setShowModal(false)
          }
        >
          <motion.div
            className="modal"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <h2>Create New Goal</h2>
            <form onSubmit={handleCreateGoal}>
              <div className="form-group">
                <label>Title</label>
                <input
                  name="title"
                  value={newGoal.title}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  rows="3"
                  value={newGoal.description}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select
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
                  <label>Difficulty</label>
                  <select
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
                <label>Target Date</label>
                <input
                  type="date"
                  name="target_date"
                  value={newGoal.target_date}
                  onChange={handleInputChange}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
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

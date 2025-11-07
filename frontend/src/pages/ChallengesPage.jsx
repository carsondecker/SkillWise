import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ChallengeCard from '../components/challenges/ChallengeCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { apiService } from '../services/api';
import { useAuth } from '../hooks/useAuth'; // ✅ import auth hook
import '../styles/ChallengesPage.scss';

const ChallengesPage = () => {
  const { user } = useAuth(); // ✅ get current logged-in user
  const [challenges, setChallenges] = useState([]);
  const [filteredChallenges, setFilteredChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    difficulty: '',
    search: '',
  });
  const [newChallenge, setNewChallenge] = useState({
    title: '',
    description: '',
    instructions: '',
    category: '',
    difficulty_level: 'medium',
    points_reward: 10,
    estimated_time_minutes: 30,
    tags: '',
    learning_objectives: '',
  });

  // 🔹 Fetch challenges from API
  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        setLoading(true);
        const res = await apiService.challenges.getAll();

        const fetchedChallenges = Array.isArray(res.data)
          ? res.data
          : res.data?.challenges || [];

        setChallenges(fetchedChallenges);
        setFilteredChallenges(fetchedChallenges);
      } catch (error) {
        console.error('Failed to load challenges:', error);
        setChallenges([]);
        setFilteredChallenges([]);
      } finally {
        setLoading(false);
      }
    };

    fetchChallenges();
  }, []);

  // 🔹 Filtering logic
  useEffect(() => {
    let filtered = [...challenges];

    if (filters.category)
      filtered = filtered.filter(
        (c) => c.category?.toLowerCase() === filters.category.toLowerCase()
      );

    if (filters.difficulty)
      filtered = filtered.filter(
        (c) =>
          c.difficulty_level?.toLowerCase() === filters.difficulty.toLowerCase()
      );

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.title?.toLowerCase().includes(search) ||
          c.description?.toLowerCase().includes(search) ||
          c.tags?.some?.((t) => t.toLowerCase().includes(search))
      );
    }

    setFilteredChallenges(filtered);
  }, [challenges, filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // 🔹 Form input handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewChallenge((prev) => ({ ...prev, [name]: value }));
  };

  // 🔹 Create new challenge
  const handleCreateChallenge = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      const payload = {
        title: newChallenge.title.trim(),
        description: newChallenge.description.trim(),
        instructions: newChallenge.instructions.trim(),
        category: newChallenge.category,
        difficulty_level: newChallenge.difficulty_level,
        points_reward: Number(newChallenge.points_reward),
        estimated_time_minutes: Number(newChallenge.estimated_time_minutes),
        requires_peer_review: false,
        is_active: true,
        created_by: user?.id || 1,
        tags: newChallenge.tags
          ? newChallenge.tags.split(',').map((t) => t.trim())
          : [],
        learning_objectives: newChallenge.learning_objectives
          ? newChallenge.learning_objectives.split(',').map((t) => t.trim())
          : [],
      };

      const res = await apiService.challenges.create(payload);
      const created = res.data.challenge || res.data;

      setChallenges((prev) => [created, ...prev]);
      setFilteredChallenges((prev) => [created, ...prev]);
      setShowModal(false);

      // Reset form
      setNewChallenge({
        title: '',
        description: '',
        instructions: '',
        category: '',
        difficulty_level: 'medium',
        points_reward: 10,
        estimated_time_minutes: 30,
        tags: '',
        learning_objectives: '',
      });
    } catch (error) {
      console.error('❌ Failed to create challenge:', error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="challenges-page">
      <div className="page-header">
        <div className="header-left">
          <h1>⚔️ Learning Challenges</h1>
          <p>Enhance your skills with real, hands-on challenges.</p>
        </div>

        {/* ✅ Only show to admins */}
        {user?.role === 'admin' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-primary"
            onClick={() => setShowModal(true)}
          >
            + Create Challenge
          </motion.button>
        )}
      </div>

      <div className="challenges-filters">
        <div className="filters-row">
          <div className="filter-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search by title, tags, or description..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Category</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="programming">Programming</option>
              <option value="design">Design</option>
              <option value="backend">Backend</option>
              <option value="data-science">Data Science</option>
              <option value="business">Business</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Difficulty</label>
            <select
              value={filters.difficulty}
              onChange={(e) => handleFilterChange('difficulty', e.target.value)}
            >
              <option value="">All Levels</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        <div className="results-summary">
          <p>
            Showing {filteredChallenges.length} of {challenges.length}{' '}
            challenges
          </p>
        </div>
      </div>

      <div className="challenges-content">
        {loading ? (
          <LoadingSpinner message="Loading challenges..." />
        ) : filteredChallenges.length > 0 ? (
          <div className="challenges-grid">
            {filteredChallenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>No challenges found</h3>
            <p>Try adjusting your filters or search.</p>
            <button
              className="btn-secondary"
              onClick={() =>
                setFilters({ category: '', difficulty: '', search: '' })
              }
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* ✅ Create Challenge Modal (Admin only) */}
      {user?.role === 'admin' && showModal && (
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
            <h2>Create New Challenge</h2>
            <form onSubmit={handleCreateChallenge}>
              <div className="form-group">
                <label>Title</label>
                <input
                  name="title"
                  value={newChallenge.title}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  rows="3"
                  value={newChallenge.description}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Instructions</label>
                <textarea
                  name="instructions"
                  rows="2"
                  value={newChallenge.instructions}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select
                    name="category"
                    value={newChallenge.category}
                    onChange={handleInputChange}
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
                    value={newChallenge.difficulty_level}
                    onChange={handleInputChange}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Points Reward</label>
                  <input
                    type="number"
                    name="points_reward"
                    value={newChallenge.points_reward}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Estimated Time (min)</label>
                  <input
                    type="number"
                    name="estimated_time_minutes"
                    value={newChallenge.estimated_time_minutes}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input
                  name="tags"
                  value={newChallenge.tags}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Learning Objectives (comma-separated)</label>
                <input
                  name="learning_objectives"
                  value={newChallenge.learning_objectives}
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
                  {creating ? 'Creating...' : 'Create Challenge'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ChallengesPage;

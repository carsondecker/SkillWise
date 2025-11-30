import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import ChallengeCard from '../components/challenges/ChallengeCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { apiService } from '../services/api';
import { useAuth } from '../hooks/useAuth'; // ✅ import auth hook
import '../styles/ChallengesPage.scss';
import ChallengeModal from '../components/challenges/ChallengeModal';

const ChallengesPage = () => {
  const { user } = useAuth(); // ✅ get current logged-in user
  const [challenges, setChallenges] = useState([]);
  const [filteredChallenges, setFilteredChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const modalRef = useRef(); // 👈 ref to talk to the modal
  const [editingChallenge, setEditingChallenge] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    difficulty: '',
    search: '',
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
    setTimeout(() => {
      void fetchChallenges();
      setLoading(false);
    }, 1000);
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
  const handleEdit = (challenge) => {
    setEditingChallenge(challenge);
    setShowModal(true);
    // Hack: wait a tick then prefill using ref
    setTimeout(() => {
      if (modalRef.current) modalRef.current.prefillForm(challenge);
    }, 0);
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
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                onEdit={handleEdit}
              />
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
        <ChallengeModal
          ref={modalRef}
          onClose={() => setShowModal(false)}
          onCreatedOrUpdated={(challenge) => {
            setChallenges((prev) => {
              const exists = prev.some((c) => c.id === challenge.id);
              return exists
                ? prev.map((c) => (c.id === challenge.id ? challenge : c))
                : [challenge, ...prev];
            });
          }}
        />
      )}
    </div>
  );
};

export default ChallengesPage;

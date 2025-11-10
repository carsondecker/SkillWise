// TODO: Implement challenges browsing and participation page
import React, { useState, useEffect } from 'react';
import ChallengeCard from '../components/challenges/ChallengeCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import api from '../services/api';

const ChallengesPage = () => {
  const [challenges, setChallenges] = useState([]);
  const [filteredChallenges, setFilteredChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    difficulty: '',
    search: '',
  });

  const fetchChallenges = async (opts = {}) => {
    setLoading(true);
    setError(null);

    const params = {
      category: filters.category || undefined,
      difficulty: filters.difficulty || undefined,
      search: filters.search || undefined,
      limit: opts.limit || 50,
      page: opts.page || 1,
    };

    // remove undefined keys
    Object.keys(params).forEach(k => params[k] === undefined && delete params[k]);

    try {
      const res = await api.get('/challenges', { params });
      const payload = res?.data;
      let items = [];

      if (Array.isArray(payload)) {
        items = payload;
      } else if (Array.isArray(payload?.challenges)) {
        items = payload.challenges;
      } else if (Array.isArray(payload?.data)) {
        items = payload.data;
      } else if (Array.isArray(payload?.results)) {
        items = payload.results;
      }

      setChallenges(items);
      setFilteredChallenges(items);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to load challenges');
      setChallenges([]);
      setFilteredChallenges([]);
    } finally {
      setLoading(false);
    }
  };

  // initial load
  useEffect(() => {
    fetchChallenges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // refetch when filters change (debounced)
  useEffect(() => {
    const t = setTimeout(() => fetchChallenges(), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.category, filters.difficulty, filters.search]);

  // client-side filtering fallback (keeps behaviour if server doesn't support all params)
  useEffect(() => {
    let filtered = challenges;
    if (filters.category) {
      filtered = filtered.filter(ch =>
        (ch.category || '').toLowerCase() === filters.category.toLowerCase()
      );
    }
    if (filters.difficulty) {
      filtered = filtered.filter(ch =>
        (ch.difficulty || '').toLowerCase() === filters.difficulty.toLowerCase()
      );
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(ch =>
        (ch.title || '').toLowerCase().includes(q) ||
        (ch.description || '').toLowerCase().includes(q) ||
        ((ch.tags || []).some(tag => tag.toLowerCase().includes(q)))
      );
    }
    setFilteredChallenges(filtered);
  }, [challenges, filters]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value,
    }));
  };

  return (
    <div className="challenges-page">
      <div className="page-header">
        <h1>Learning Challenges</h1>
        <p>Enhance your skills with hands-on learning experiences</p>
      </div>

      <div className="challenges-filters">
        <div className="filters-row">
          <div className="filter-group">
            <label htmlFor="search">Search Challenges</label>
            <input
              type="text"
              id="search"
              placeholder="Search by title, description, or tags..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
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
            <label htmlFor="difficulty">Difficulty</label>
            <select
              id="difficulty"
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
          <p>Showing {filteredChallenges.length} of {challenges.length} challenges</p>
        </div>
      </div>

      <div className="challenges-content">
        {loading ? (
          <LoadingSpinner message="Loading challenges..." />
        ) : error ? (
          <div className="error-state">
            <h3>Unable to load challenges</h3>
            <p>{error}</p>
            <button className="btn-secondary" onClick={() => fetchChallenges()}>Retry</button>
          </div>
        ) : filteredChallenges.length > 0 ? (
          <div className="challenges-grid">
            {filteredChallenges.map(challenge => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>No challenges found</h3>
            <p>Try adjusting your filters or search terms.</p>
            <button
              className="btn-secondary"
              onClick={() => setFilters({ category: '', difficulty: '', search: '' })}
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChallengesPage;

// TODO: Implement goals management page
import React, { useState, useEffect, useRef } from 'react';
import GoalCard from '../components/goals/GoalCard';
import '../styles/components/dashboard/GoalsPage.scss';
import { apiService } from '../services/api';
import { useLayout } from '../contexts/LayoutContext';
import Modal from '../components/ui/Modal';
import GoalForm from '../components/goals/GoalForm';

const GoalsPage = () => {
  const [goals, setGoals] = useState([]);
  const [filteredGoals, setFilteredGoals] = useState([]);
  const [filters, setFilters] = useState({ category: '' });

  const mountedRef = useRef(true);

  const loadGoals = async () => {
    try {
      const res = await apiService.goals.getAll();
      // Print the full axios response to the browser console for debugging
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.debug('[GoalsPage] API Response: GET /goals', res);
      }
      // Defensive: normalize API response into an array
      let list = [];
      if (Array.isArray(res.data)) list = res.data;
      else if (Array.isArray(res.data?.goals)) list = res.data.goals;
      else if (Array.isArray(res.data?.data)) list = res.data.data;

      //if (!mountedRef.current) return;
      setGoals(list);

      // Apply current filters immediately so UI shows items without waiting
      // for the filter effect. This avoids a race where filteredGoals stays
      // empty while goals is populated.
      if (filters?.category) {
        const normalize = (s) =>
          (s || '').toString().toLowerCase().replace(/\s+/g, '-');
        const filtered = list.filter(
          (g) => normalize(g.category) === normalize(filters.category)
        );
        setFilteredGoals(filtered);
      } else {
        setFilteredGoals(list);
      }

      console.log(list);
      console.log(filteredGoals);
    } catch (error) {
      console.error('Failed to load goals:', error);
      if (!mountedRef.current) return;
      setGoals([]);
    }
  };

  useEffect(() => {
    loadGoals();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Listen for challenge completion events dispatched by ChallengeCard to refresh goals and progress
  useEffect(() => {
    const handler = (e) => {
      // reload goals to reflect updated progress/percent
      loadGoals();
    };
    window.addEventListener('challenge:completed', handler);
    return () => window.removeEventListener('challenge:completed', handler);
  }, []);
  const { setTitle, setSubtitle } = useLayout();

  useEffect(() => {
    setTitle('My Learning Goals');
    setSubtitle('Create and track your learning goals');
  }, [setTitle, setSubtitle]);

  const [showCreateModal, setShowCreateModal] = useState(false);

  const openCreate = () => setShowCreateModal(true);
  const closeCreate = () => setShowCreateModal(false);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Apply filters (case-insensitive and normalized)
  useEffect(() => {
    const normalize = (s) =>
      (s || '').toString().toLowerCase().replace(/\s+/g, '-');
    let list = [...goals];
    if (filters.category) {
      list = list.filter(
        (g) => normalize(g.category) === normalize(filters.category)
      );
    }
    setFilteredGoals(list);
  }, [goals, filters]);

  return (
    <div className="goals-page">
      <div className="page-header">
        <h1>My Learning Goals</h1>
        <button className="btn-primary" onClick={openCreate}>
          Create New Goal
        </button>
      </div>

      <div className="goals-filters">
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

      <div className="goals-grid">
        {
          // If filteredGoals is unexpectedly empty but goals contains items,
          // fall back to rendering `goals` so the UI still shows content.
          (() => {
            const useArray =
              Array.isArray(filteredGoals) && filteredGoals.length > 0
                ? filteredGoals
                : Array.isArray(goals) && goals.length > 0
                ? goals
                : [];

            if (process.env.NODE_ENV === 'development') {
              // eslint-disable-next-line no-console
              console.debug(
                '[GoalsPage] render choosing list -> filtered:',
                filteredGoals.length,
                'goals:',
                goals.length
              );
            }

            return useArray.length > 0 ? (
              useArray.map((goal) => <GoalCard key={goal.id} goal={goal} />)
            ) : (
              <div className="empty-state">
                <p>No goals yet. Create your first learning goal!</p>
              </div>
            );
          })()
        }
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={closeCreate}
        title="Create New Goal"
      >
        <GoalForm
          onCreated={(created) => {
            // Close modal and refresh list (optimistic insert)
            closeCreate();
            if (created) {
              setGoals((prev) => [created, ...prev]);
              // Also add to filteredGoals if it matches current filters (or no filter)
              try {
                const normalize = (s) =>
                  (s || '').toString().toLowerCase().replace(/\s+/g, '-');
                if (
                  !filters?.category ||
                  normalize(created.category) === normalize(filters.category)
                ) {
                  setFilteredGoals((prev) => [created, ...prev]);
                }
              } catch (e) {
                // fallback: unconditionally prepend
                setFilteredGoals((prev) => [created, ...prev]);
              }
            }
          }}
        />
      </Modal>
    </div>
  );
};

export default GoalsPage;

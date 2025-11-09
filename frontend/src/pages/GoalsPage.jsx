// TODO: Implement goals management page
import React, { useState, useEffect } from 'react';
import GoalCard from '../components/goals/GoalCard';
import '../styles/components/dashboard/GoalsPage.scss';
import { apiService } from '../services/api';
import { useLayout } from '../contexts/LayoutContext';
import Modal from '../components/ui/Modal';
import GoalForm from '../components/goals/GoalForm';

const GoalsPage = () => {
  const [goals, setGoals] = useState([]);

  useEffect(() => {
    let mounted = true;

    const loadGoals = async () => {
      try {
        const res = await apiService.goals.getAll();
        const list = res.data?.goals || res.data || [];
        if (!mounted) return;
        setGoals(list);
      } catch (error) {
        console.error('Failed to load goals:', error);
        if (!mounted) return;
        setGoals([]);
      }
    };

    loadGoals();

    return () => {
      mounted = false;
    };
  }, []);
  const { setTitle, setSubtitle } = useLayout();

  useEffect(() => {
    setTitle('My Learning Goals');
    setSubtitle('Create and track your learning goals');
  }, [setTitle, setSubtitle]);

  const [showCreateModal, setShowCreateModal] = useState(false);

  const openCreate = () => setShowCreateModal(true);
  const closeCreate = () => setShowCreateModal(false);

  return (
    <div className="goals-page">
      <div className="page-header">
        <h1>My Learning Goals</h1>
        <button className="btn-primary" onClick={openCreate}>
          Create New Goal
        </button>
      </div>

      <div className="goals-filters">
        <select>
          <option value="">All Categories</option>
          <option value="programming">Programming</option>
          <option value="design">Design</option>
          <option value="business">Business</option>
        </select>
      </div>

      <div className="goals-grid">
        {goals.length > 0 ? (
          goals.map((goal) => <GoalCard key={goal.id} goal={goal} />)
        ) : (
          <div className="empty-state">
            <p>No goals yet. Create your first learning goal!</p>
          </div>
        )}
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
            if (created) setGoals((prev) => [created, ...prev]);
          }}
        />
      </Modal>
    </div>
  );
};

export default GoalsPage;

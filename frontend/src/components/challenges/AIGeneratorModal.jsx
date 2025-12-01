import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import '../../styles/components/Challenge/ChallengeModal.scss';
import aiClient from '../../services/aiClient';
import { apiService } from '../../services/api';

const AIGeneratorModal = ({ goalId, onClose, onManual, onCreatedOrUpdated }) => {
  const [step, setStep] = useState('choice'); // 'choice' | 'difficulty' | 'working'
  const [difficulty, setDifficulty] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [goal, setGoal] = useState(null);

  useEffect(() => {
    let mounted = true;
    const loadGoal = async () => {
      try {
        const res = await apiService.goals.getById(goalId);
        if (mounted) setGoal(res.data?.goal || res.data || {});
      } catch (err) {
        console.error('Failed to fetch goal for AI generation', err);
      }
    };
    loadGoal();
    return () => (mounted = false);
  }, [goalId]);

  const handleManual = () => {
    onManual();
    onClose();
  };

  const handleChooseAI = () => setStep('difficulty');

  const handleGenerate = async (chosen) => {
    setDifficulty(chosen);
    setStep('working');
    setLoading(true);

    try {
      // Use aiClient which now calls the backend AI endpoint (or falls back to mock)
      const created = await aiClient.generateChallenge(goal || { title: 'Goal', id: goalId }, chosen);
      // created is expected to be the persisted challenge object when backend handles persistence
      if (!created) throw new Error('AI did not return a created challenge');
      onCreatedOrUpdated(created);
      onClose();
      alert(`AI challenge created: ${created.title}`);
    } catch (err) {
      console.error('AI generation failed', err);
      alert('AI generation failed — please try again.');
      setStep('choice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target.classList.contains('modal-backdrop') && onClose()}
    >
      <motion.div className="modal" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.2 }}>
        {step === 'choice' && (
          <div>
            <h2>Create Challenge</h2>
            <p>Choose how you'd like to create this challenge for the selected goal.</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={handleManual}>Manual</button>
              <button className="btn-primary" onClick={handleChooseAI}>Generate with AI</button>
            </div>
          </div>
        )}

        {step === 'difficulty' && (
          <div>
            <h2>AI Generated Challenge</h2>
            <p>Select target difficulty for the generated challenge.</p>
            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <button className="btn" onClick={() => handleGenerate('easy')}>Easy</button>
              <button className="btn" onClick={() => handleGenerate('medium')}>Medium</button>
              <button className="btn" onClick={() => handleGenerate('hard')}>Hard</button>
            </div>
            <div style={{ marginTop: 18 }}>
              <button className="btn-secondary" onClick={() => setStep('choice')}>Back</button>
            </div>
          </div>
        )}

        {step === 'working' && (
          <div>
            <h2>Generating...</h2>
            <p>Please wait while the AI creates a challenge. This may take a few seconds.</p>
            {loading && <div className="spinner">Working...</div>}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AIGeneratorModal;

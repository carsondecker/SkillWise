// Lightweight AI client wrapper — currently returns mock responses.
// Swap to a real API call by replacing `generateChallenge` implementation.
import { apiService } from './api';

const aiClient = {
  /**
   * Generate a challenge for a goal using the backend AI endpoint.
   * Falls back to a local mock if the API call fails (useful for dev offline).
   * Returns the created challenge object (response.data.challenge) when backend persists it.
   */
  generateChallenge: async (goal, difficulty = 'medium') => {
    try {
      const body = {
        goal_id: goal.id || goalIdFromGoal(goal),
        difficulty: difficulty,
        auto_activate: true,
      };

      const resp = await apiService.ai.generateChallenge(body);
      // backend returns { challenge: { ... } }
      const challenge = resp.data?.challenge || resp.data;
      if (!challenge) {
        const err = new Error('AI backend returned an invalid response');
        window.dispatchEvent(new CustomEvent('ai:down', { detail: { message: err.message } }));
        throw err;
      }
      // signal UI that AI is available
      window.dispatchEvent(new CustomEvent('ai:up', { detail: { message: 'AI available' } }));
      return challenge;
    } catch (err) {
      console.warn('AI backend call failed:', err.message || err);
      const msg = err.response?.data?.message || err.message || 'AI backend error';
      window.dispatchEvent(new CustomEvent('ai:down', { detail: { message: msg } }));
      // Do not fallback to mock here — surface error to caller so UI can handle it.
      throw err;
    }
  },
};

function goalIdFromGoal(goal) {
  return (goal && (goal.id || goal.goal_id)) || null;
}

export default aiClient;

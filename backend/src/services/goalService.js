
// src/services/goalService.js
const Goal = require('../models/Goal');
const { AppError } = require('../middleware/errorHandler');

const goalService = {
  /**
   * 📋 Get all goals for a user
   */
  getGoals: async ({ userId, limit = 20, offset = 0 }) => {
    try {
      const goals = await Goal.findByUserId(userId, limit, offset);
      return goals.map(goal => ({
        ...goal,
        completion: goalService.calculateCompletion(goal),
      }));
    } catch (error) {
      throw new AppError(`Error fetching goals: ${error.message}`, 500);
    }
  },
  getGoalById: async ({ userId, goalId }) => {
    try {
      const goal = await Goal.findById(goalId);
      if (!goal || goal.user_id !== userId) {
        throw new AppError('Goal not found', 404, 'GOAL_NOT_FOUND');
      }
      return goal;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Error fetching goal: ${error.message}`, 500);
    }
  },

  /**
   * 🧾 Create a new goal
   */
  createGoal: async ({ userId, title, description, category, target_completion_date }) => {
    try {
      if (!title || title.trim() === '') {
        throw new AppError('Title is required', 400, 'VALIDATION_ERROR');
      }

      const newGoal = await Goal.create({
        user_id: userId,
        title: title.trim(),
        description: description?.trim() || '',
        category: category || 'General',
        target_completion_date: target_completion_date || null,
      });

      return newGoal;
    } catch (error) {
      throw new AppError(`Error creating goal: ${error.message}`, 500);
    }
  },

  /**
   * ✏️ Update existing goal
   */
  updateGoal: async ({ userId, goalId, data }) => {
    try {
      const updated = await Goal.update(goalId, data);
      if (!updated) {
        throw new AppError('Goal not found', 404, 'GOAL_NOT_FOUND');
      }

      return updated;
    } catch (error) {
      // Only rethrow if not already AppError
      if (error instanceof AppError) throw error;
      throw new AppError(`Error updating goal: ${error.message}`, 500);
    }
  },

  /**
   * ❌ Delete a goal
   */
  deleteGoal: async ({ userId, goalId }) => {
    try {
      const deletedGoal = await Goal.delete(goalId);
      if (!deletedGoal) throw new AppError('Goal not found', 404, 'GOAL_NOT_FOUND');
      return deletedGoal;
    } catch (error) {
      throw new AppError(`Error deleting goal: ${error.message}`, 500);
    }
  },

  /**
   * 📊 Calculate completion percentage
   */
  calculateCompletion: (goal) => {
    // Your DB uses progress_percentage
    if (goal?.progress_percentage != null) {
      return Math.min(goal.progress_percentage, 100);
    }
    return 0;
  },
};

module.exports = goalService;

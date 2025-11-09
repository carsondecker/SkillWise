// src/services/progressService.js
const Progress = require('../models/Progress');
const db = require('../database/connection');
const { AppError } = require('../middleware/errorHandler');
const notificationService = require('./notificationService');
const leaderboardService = require('./leaderboardService');

const progressService = {
  /**
   * 📊 Calculate overall progress summary for a user
   */
  calculateOverallProgress: async (userId) => {
    try {
      const stats = await Progress.getUserStats(userId);

      return {
        userId,
        totalAttempts: Number(stats.total_attempts || 0),
        completedChallenges: Number(stats.completed_challenges || 0),
        totalPoints: Number(stats.total_points || 0),
        averageScore: Number(stats.average_score || 0),
        completionRate: stats.total_attempts
          ? Math.round(
              (stats.completed_challenges / stats.total_attempts) * 100
            )
          : 0,
      };
    } catch (error) {
      throw new AppError(
        `Error calculating overall progress: ${error.message}`,
        500
      );
    }
  },

  /**
   * 🧠 Track learning-related event (e.g., challenge_completed, goal_updated)
   */
  trackEvent: async (userId, eventType, eventData = {}) => {
    try {
      // Record in progress_events table
      await db.query(
        `
        INSERT INTO progress_events (user_id, event_type, event_data, created_at)
        VALUES ($1, $2, $3, NOW())
        `,
        [userId, eventType, JSON.stringify(eventData)]
      );

      // If user completed a challenge, award points
      if (eventType === 'challenge_completed') {
        const points = eventData.points_earned || 10;
        await leaderboardService.updateUserPoints(userId, points, eventType);

        await notificationService.sendNotification(
          userId,
          'challenge_completed',
          `You earned ${points} points for completing a challenge!`,
          { challengeId: eventData.challenge_id }
        );
        // If this challenge is linked to a goal, recalculate goal progress for the user
        if (eventData.related_goal_id) {
          try {
            const goalId = Number(eventData.related_goal_id);
            // total challenges linked to the goal
            const totalRes = await db.query(
              'SELECT COUNT(*)::int AS total FROM challenges WHERE related_goal_id = $1 AND is_active = true',
              [goalId]
            );
            const total = Number(totalRes.rows[0]?.total || 0);

            if (total > 0) {
              // count distinct challenges the user has completed for this goal
              const completedRes = await db.query(
                `
                SELECT COUNT(DISTINCT c.id)::int AS completed
                FROM challenges c
                JOIN submissions s ON s.challenge_id = c.id
                WHERE c.related_goal_id = $1
                  AND s.user_id = $2
                  AND (s.status = 'completed' OR (s.score IS NOT NULL AND s.score >= 70))
                `,
                [goalId, userId]
              );

              const completed = Number(completedRes.rows[0]?.completed || 0);
              const pct = Math.min(100, Math.round((completed / total) * 100));

              // Persist into goals table
              await db.query(
                'UPDATE goals SET progress_percentage = $1, updated_at = NOW() WHERE id = $2',
                [pct, goalId]
              );

              // If reached or passed 100%, emit a goal_completed event
              if (pct >= 100) {
                // create a goal_completed event (this will also notify via trackEvent logic)
                await progressService.trackEvent(userId, 'goal_completed', {
                  goal_id: goalId,
                });
              }
            }
          } catch (err) {
            // Best-effort: don't block main flow
            console.error(
              'Failed to update goal progress after challenge completion:',
              err.message
            );
          }
        }
      }

      // If user completed a goal, send milestone notification
      if (eventType === 'goal_completed') {
        await notificationService.sendNotification(
          userId,
          'goal_completed',
          '🎉 Congratulations on completing your goal!',
          { goalId: eventData.goal_id }
        );
      }

      return {
        message: `Event '${eventType}' tracked successfully`,
        userId,
        eventType,
      };
    } catch (error) {
      throw new AppError(
        `Error tracking progress event: ${error.message}`,
        500
      );
    }
  },

  /**
   * 📈 Generate progress analytics over time
   * @param {number} userId
   * @param {string} timeframe - 'weekly' | 'monthly' | 'all'
   */
  generateAnalytics: async (userId, timeframe = 'weekly') => {
    try {
      let dateFilter = '';
      if (timeframe === 'weekly')
        dateFilter = "AND p.created_at >= NOW() - INTERVAL '7 days'";
      else if (timeframe === 'monthly')
        dateFilter = "AND p.created_at >= NOW() - INTERVAL '30 days'";

      const result = await db.query(
        `
        SELECT
          DATE_TRUNC('day', p.created_at) AS date,
          COUNT(*) AS activities,
          SUM(p.points_earned) AS total_points,
          AVG(p.score) AS avg_score
        FROM progress p
        WHERE p.user_id = $1
        ${dateFilter}
        GROUP BY DATE_TRUNC('day', p.created_at)
        ORDER BY date ASC
        `,
        [userId]
      );

      return {
        userId,
        timeframe,
        data: result.rows.map((r) => ({
          date: r.date,
          activities: Number(r.activities),
          points: Number(r.total_points),
          averageScore: Number(r.avg_score),
        })),
      };
    } catch (error) {
      throw new AppError(`Error generating analytics: ${error.message}`, 500);
    }
  },

  /**
   * 🏅 Check milestone achievements for user
   */
  checkMilestones: async (userId) => {
    try {
      const stats = await Progress.getUserStats(userId);
      const achievements = [];

      if (Number(stats.completed_challenges) >= 10) {
        achievements.push({
          title: '10 Challenges Completed',
          description: 'You’ve completed 10 challenges!',
          difficulty: 'medium',
          category: 'milestone',
        });
      }

      if (Number(stats.total_points) >= 500) {
        achievements.push({
          title: '500 Points Earned',
          description: 'You’ve earned over 500 points!',
          difficulty: 'hard',
          category: 'streak',
        });
      }

      if (Number(stats.average_score) >= 90) {
        achievements.push({
          title: 'High Performer',
          description: 'You maintain an average score of 90%+.',
          difficulty: 'hard',
          category: 'performance',
        });
      }

      // Award points + notifications for new milestones
      for (const achievement of achievements) {
        const points =
          leaderboardService.calculateAchievementPoints(achievement);
        await leaderboardService.updateUserPoints(userId, points, 'milestone');
        await notificationService.sendNotification(
          userId,
          'achievement',
          `🏆 ${achievement.title} — ${achievement.description}`,
          achievement
        );
      }

      return {
        userId,
        newAchievements: achievements,
        totalUnlocked: achievements.length,
      };
    } catch (error) {
      throw new AppError(`Error checking milestones: ${error.message}`, 500);
    }
  },
};

module.exports = progressService;

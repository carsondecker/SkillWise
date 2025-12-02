// src/services/progressService.js
const Progress = require('../models/Progress');
const db = require('../database/connection');
const { AppError } = require('../middleware/errorHandler');
const notificationService = require('./notificationService');
const leaderboardService = require('./leaderboardService');

const TIMEFRAME_WINDOWS = {
  week: 7,
  month: 30,
  year: 365,
};

const resolveWindow = (timeframe) =>
  TIMEFRAME_WINDOWS[timeframe] ? TIMEFRAME_WINDOWS[timeframe] : TIMEFRAME_WINDOWS.week;

const fetchOverallStats = async (userId) => {
  const { rows } = await db.query(
    `
    SELECT
      us.total_points,
      us.total_challenges_completed,
      us.total_goals_completed,
      us.average_score,
      us.level,
      us.experience_points,
      us.total_time_spent_minutes,
      us.current_streak_days,
      us.longest_streak_days
    FROM user_statistics us
    WHERE us.user_id = $1
    `,
    [userId],
  );

  const stats = rows[0] || {};
  const totalPoints = Number(stats.total_points || 0);
  const level = Number(stats.level || 1);
  const fallbackStats = (await Progress.getUserStats(userId)) || {};

  return {
    totalPoints: totalPoints || Number(fallbackStats.total_points || 0),
    level,
    experiencePoints: Number(stats.experience_points || totalPoints),
    nextLevelXP: (level + 1) * 500,
    completedGoals: Number(stats.total_goals_completed || 0),
    completedChallenges: Number(
      stats.total_challenges_completed ?? fallbackStats.completed_challenges ?? 0,
    ),
    currentStreak: Number(stats.current_streak_days || 0),
    longestStreak: Number(stats.longest_streak_days || 0),
    totalTimeSpentMinutes: Number(stats.total_time_spent_minutes || 0),
    averageScore: Number(stats.average_score || fallbackStats.average_score || 0),
  };
};

const fetchRecentActivity = async (userId, limit = 5) => {
  const { rows } = await db.query(
    `
    SELECT
      p.id,
      p.event_type,
      p.points_earned,
      p.created_at,
      p.event_data,
      g.title AS goal_title,
      c.title AS challenge_title
    FROM progress_events p
    LEFT JOIN goals g ON p.related_goal_id = g.id
    LEFT JOIN challenges c ON p.related_challenge_id = c.id
    WHERE p.user_id = $1
    ORDER BY p.created_at DESC
    LIMIT $2
    `,
    [userId, limit],
  );

  return rows.map((row) => ({
    id: row.id,
    type: row.event_type,
    title: row.challenge_title || row.goal_title || row.event_data?.title || 'Progress update',
    points: Number(row.points_earned || 0),
    timestamp: row.created_at,
    extra: row.event_data || {},
  }));
};

const fetchWeeklyProgress = async (userId, timeframe = 'week') => {
  const daysWindow = resolveWindow(timeframe);

  const { rows } = await db.query(
    `
    WITH days AS (
      SELECT generate_series(
        (DATE_TRUNC('day', NOW()) - INTERVAL '${daysWindow - 1} days'),
        DATE_TRUNC('day', NOW()),
        '1 day'
      )::date AS day
    ),
    event_rollup AS (
      SELECT
        DATE_TRUNC('day', created_at)::date AS day,
        SUM(points_earned) AS points,
        COUNT(*) FILTER (WHERE event_type = 'challenge_completed') AS challenges_completed,
        MIN(created_at) AS first_event,
        MAX(created_at) AS last_event
      FROM progress_events
      WHERE user_id = $1
        AND created_at >= DATE_TRUNC('day', NOW()) - INTERVAL '${daysWindow - 1} days'
      GROUP BY DATE_TRUNC('day', created_at)
    )
    SELECT
      d.day,
      COALESCE(er.points, 0) AS points,
      COALESCE(er.challenges_completed, 0) AS challenges_completed,
      CASE
        WHEN er.first_event IS NULL THEN 0
        ELSE GREATEST(
          ROUND(EXTRACT(EPOCH FROM (er.last_event - er.first_event)) / 60.0),
          5
        )
      END AS time_spent_minutes
    FROM days d
    LEFT JOIN event_rollup er ON er.day = d.day
    ORDER BY d.day
    `,
    [userId],
  );

  return rows.map((row) => ({
    date: row.day,
    points: Number(row.points || 0),
    timeSpentMinutes: Number(row.time_spent_minutes || 0),
    challengesCompleted: Number(row.challenges_completed || 0),
  }));
};

const fetchSessionStats = async (userId, timeframe = 'week') => {
  const daysWindow = resolveWindow(timeframe);

  const { rows } = await db.query(
    `
    WITH sessions AS (
      SELECT
        COALESCE(session_id, TO_CHAR(DATE_TRUNC('day', created_at), 'YYYY-MM-DD')) AS session_key,
        MIN(created_at) AS started_at,
        MAX(created_at) AS ended_at,
        COUNT(*) FILTER (WHERE event_type = 'challenge_completed') AS challenges_completed,
        COALESCE(SUM(points_earned), 0) AS points_earned
      FROM progress_events
      WHERE user_id = $1
        AND created_at >= NOW() - INTERVAL '${daysWindow} days'
      GROUP BY COALESCE(session_id, TO_CHAR(DATE_TRUNC('day', created_at), 'YYYY-MM-DD'))
    )
    SELECT
      session_key,
      started_at,
      ended_at,
      GREATEST(
        ROUND(EXTRACT(EPOCH FROM (ended_at - started_at)) / 60.0),
        5
      ) AS duration_minutes,
      challenges_completed,
      points_earned
    FROM sessions
    ORDER BY ended_at DESC
    LIMIT 10
    `,
    [userId],
  );

  return rows.map((row) => ({
    sessionId: row.session_key,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    durationMinutes: Number(row.duration_minutes || 0),
    challengesCompleted: Number(row.challenges_completed || 0),
    pointsEarned: Number(row.points_earned || 0),
  }));
};

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
            (stats.completed_challenges / stats.total_attempts) * 100,
          )
          : 0,
      };
    } catch (error) {
      throw new AppError(
        `Error calculating overall progress: ${error.message}`,
        500,
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
        [userId, eventType, JSON.stringify(eventData)],
      );

      // If user completed a challenge, award points
      if (eventType === 'challenge_completed') {
        const points = eventData.points_earned || 10;
        await leaderboardService.updateUserPoints(userId, points, eventType);

        await notificationService.sendNotification(
          userId,
          'challenge_completed',
          `You earned ${points} points for completing a challenge!`,
          { challengeId: eventData.challenge_id },
        );
      }

      // If user completed a goal, send milestone notification
      if (eventType === 'goal_completed') {
        await notificationService.sendNotification(
          userId,
          'goal_completed',
          '🎉 Congratulations on completing your goal!',
          { goalId: eventData.goal_id },
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
        500,
      );
    }
  },
  getProgressLatest: async ({ userId }) => {
    try {
      if (!userId) {
        throw new AppError('User ID is required', 400, 'INVALID_INPUT');
      }

      const query = `
        SELECT
          p.id,
          p.user_id,
          p.related_goal_id AS goal_id,
          p.related_challenge_id AS challenge_id,
          p.event_type,
          p.points_earned,
          p.created_at,
          p.updated_at,
          g.title AS goal_title,
          g.category AS goal_category,
          c.title AS challenge_title,
          c.difficulty_level AS challenge_difficulty
        FROM progress_events p
               LEFT JOIN goals g ON p.related_goal_id = g.id
               LEFT JOIN challenges c ON p.related_challenge_id = c.id
        WHERE p.user_id = $1
        ORDER BY p.updated_at DESC
          LIMIT 3
      `;

      const { rows } = await db.query(query, [userId]);

      // Normalize for consistent frontend format
      return rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        eventType: row.event_type,
        activityType: row.activity_type, // "goal" | "challenge" | "other"
        title: row.activity_title,
        pointsEarned: row.points_earned,
        category: row.activity_category,
        goalId: row.goal_id,
        challengeId: row.challenge_id,
        goalTitle: row.goal_title,
        challengeTitle: row.challenge_title,
        challengeDifficulty: row.challenge_difficulty,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch (error) {
      throw new AppError(
        `Error fetching latest progress: ${error.message}`,
        500,
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
        dateFilter = 'AND p.created_at >= NOW() - INTERVAL \'7 days\'';
      else if (timeframe === 'monthly')
        dateFilter = 'AND p.created_at >= NOW() - INTERVAL \'30 days\'';

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
        [userId],
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
          achievement,
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
/**
 * 🧾 Get user progress overview (used in /progress/stats)
 */
const getProgressOverview = async ({ userId, timeframe = 'week' }) => {
  const [overall, weeklyProgress, sessionStats, recentActivity] = await Promise.all([
    fetchOverallStats(userId),
    fetchWeeklyProgress(userId, timeframe),
    fetchSessionStats(userId, timeframe),
    fetchRecentActivity(userId),
  ]);

  return {
    userId,
    overall,
    weeklyProgress,
    sessionStats,
    recentActivity,
    skillBreakdown: [], // Placeholder until skills are modeled in progress data
  };
};

progressService.getProgressOverview = getProgressOverview;

module.exports = progressService;

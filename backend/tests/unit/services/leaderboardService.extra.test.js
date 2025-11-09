jest.mock('../../../src/models/Leaderboard', () => ({
  getGlobalLeaderboard: jest.fn(),
  getWeeklyLeaderboard: jest.fn(),
  getMonthlyLeaderboard: jest.fn(),
  getSubjectLeaderboard: jest.fn(),
  getDailyLeaderboard: jest.fn(),
  getUserRank: jest.fn(),
}));

const Leaderboard = require('../../../src/models/Leaderboard');
const leaderboardService = require('../../../src/services/leaderboardService');
const { AppError } = require('../../../src/middleware/errorHandler');

afterEach(() => jest.clearAllMocks());

describe('Leaderboard Service - additional methods', () => {
  describe('getLeaderboard', () => {
    test('calls global leaderboard for default/alltime', async () => {
      Leaderboard.getGlobalLeaderboard.mockResolvedValue([{ id: 1 }]);
      const rows = await leaderboardService.getLeaderboard({
        period: 'alltime',
        limit: 20,
      });
      expect(Leaderboard.getGlobalLeaderboard).toHaveBeenCalledWith(20);
      expect(rows).toEqual([{ id: 1 }]);
    });

    test('calls weekly leaderboard when period=weekly', async () => {
      Leaderboard.getWeeklyLeaderboard.mockResolvedValue([{ id: 2 }]);
      const rows = await leaderboardService.getLeaderboard({
        period: 'weekly',
        limit: 5,
      });
      expect(Leaderboard.getWeeklyLeaderboard).toHaveBeenCalledWith(5);
      expect(rows).toEqual([{ id: 2 }]);
    });

    test('calls monthly leaderboard when period=monthly', async () => {
      Leaderboard.getMonthlyLeaderboard.mockResolvedValue([{ id: 3 }]);
      const rows = await leaderboardService.getLeaderboard({
        period: 'monthly',
        limit: 3,
      });
      expect(Leaderboard.getMonthlyLeaderboard).toHaveBeenCalledWith(3);
      expect(rows).toEqual([{ id: 3 }]);
    });

    test('calls subject leaderboard when category provided', async () => {
      Leaderboard.getSubjectLeaderboard.mockResolvedValue([{ id: 4 }]);
      const rows = await leaderboardService.getLeaderboard({
        period: 'alltime',
        limit: 10,
        category: 'math',
      });
      expect(Leaderboard.getSubjectLeaderboard).toHaveBeenCalledWith(
        'math',
        10
      );
      expect(rows).toEqual([{ id: 4 }]);
    });

    test('uses daily leaderboard when available', async () => {
      Leaderboard.getDailyLeaderboard.mockResolvedValue([{ id: 5 }]);
      const rows = await leaderboardService.getLeaderboard({
        period: 'daily',
        limit: 2,
      });
      expect(Leaderboard.getDailyLeaderboard).toHaveBeenCalledWith(2);
      expect(rows).toEqual([{ id: 5 }]);
    });

    test('falls back to weekly when daily not implemented', async () => {
      // ensure getDailyLeaderboard is undefined
      delete Leaderboard.getDailyLeaderboard;
      Leaderboard.getWeeklyLeaderboard.mockResolvedValue([{ id: 6 }]);
      const rows = await leaderboardService.getLeaderboard({
        period: 'daily',
        limit: 7,
      });
      expect(Leaderboard.getWeeklyLeaderboard).toHaveBeenCalledWith(7);
      expect(rows).toEqual([{ id: 6 }]);
    });

    test('throws AppError when model errors', async () => {
      Leaderboard.getGlobalLeaderboard.mockRejectedValue(new Error('boom'));
      await expect(
        leaderboardService.getLeaderboard({ period: 'alltime' })
      ).rejects.toThrow(AppError);
    });
  });

  describe('getUserRanking and getPointsBreakdown', () => {
    test('getUserRanking returns row when present', async () => {
      Leaderboard.getUserRank.mockResolvedValue({
        rank: 12,
        total_points: 420,
      });
      const row = await leaderboardService.getUserRanking({ userId: 1 });
      expect(Leaderboard.getUserRank).toHaveBeenCalledWith(1);
      expect(row).toEqual({ rank: 12, total_points: 420 });
    });

    test('getUserRanking returns null when no userId', async () => {
      const row = await leaderboardService.getUserRanking({});
      expect(row).toBeNull();
    });

    test('getPointsBreakdown returns ranking for user', async () => {
      Leaderboard.getUserRank.mockResolvedValue({ rank: 3, total_points: 900 });
      const row = await leaderboardService.getPointsBreakdown({ userId: 2 });
      expect(Leaderboard.getUserRank).toHaveBeenCalledWith(2);
      expect(row).toEqual({ rank: 3, total_points: 900 });
    });

    test('getPointsBreakdown returns null when no userId', async () => {
      const row = await leaderboardService.getPointsBreakdown({});
      expect(row).toBeNull();
    });

    test('getAchievements returns empty array by default', async () => {
      const res = await leaderboardService.getAchievements({ userId: 1 });
      expect(res).toEqual([]);
    });
  });
});

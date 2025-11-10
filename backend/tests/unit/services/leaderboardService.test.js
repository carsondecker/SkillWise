jest.mock('../../../src/models/Leaderboard', () => ({
  getGlobalLeaderboard: jest.fn(),
  getWeeklyLeaderboard: jest.fn(),
  getMonthlyLeaderboard: jest.fn(),
}));

const Leaderboard = require('../../../src/models/Leaderboard');
const leaderboardService = require('../../../src/services/leaderboardService');
const { AppError } = require('../../../src/middleware/errorHandler');

afterEach(() => {
  jest.clearAllMocks();
});

describe('Leaderboard Service', () => {
  describe('calculateRankings', () => {
    test('returns weekly leaderboard when timeframe is weekly', async () => {
      const rows = [{ id: 1 }, { id: 2 }];
      Leaderboard.getWeeklyLeaderboard.mockResolvedValue(rows);

      const res = await leaderboardService.calculateRankings('weekly');
      expect(Leaderboard.getWeeklyLeaderboard).toHaveBeenCalled();
      expect(res).toBe(rows);
    });

    test('returns monthly leaderboard when timeframe is monthly', async () => {
      const rows = [{ id: 3 }];
      Leaderboard.getMonthlyLeaderboard.mockResolvedValue(rows);

      const res = await leaderboardService.calculateRankings('monthly');
      expect(Leaderboard.getMonthlyLeaderboard).toHaveBeenCalled();
      expect(res).toBe(rows);
    });

    test('defaults to global leaderboard for unknown timeframe', async () => {
      const rows = [{ id: 4 }];
      Leaderboard.getGlobalLeaderboard.mockResolvedValue(rows);

      const res = await leaderboardService.calculateRankings('unknown');
      expect(Leaderboard.getGlobalLeaderboard).toHaveBeenCalled();
      expect(res).toBe(rows);
    });
  });

  describe('getTopPerformers', () => {
    test('maps leaderboard rows to top performer shape', async () => {
      const rows = [
        {
          id: 10,
          first_name: 'Alex',
          last_name: 'Johnson',
          total_points: '250',
          challenges_completed: '5',
          average_score: '92.5',
        },
        {
          id: 11,
          first_name: 'Taylor',
          last_name: 'Reed',
          total_points: null,
          challenges_completed: null,
          average_score: null,
        },
      ];

      Leaderboard.getGlobalLeaderboard.mockResolvedValue(rows);

      const res = await leaderboardService.getTopPerformers(2);
      expect(Leaderboard.getGlobalLeaderboard).toHaveBeenCalledWith(2);
      expect(res).toHaveLength(2);
      expect(res[0]).toMatchObject({
        rank: 1,
        userId: 10,
        name: 'Alex Johnson',
        totalPoints: 250,
        challengesCompleted: 5,
      });

      // second row had nulls => defaults to 0
      expect(res[1]).toMatchObject({
        rank: 2,
        userId: 11,
        name: 'Taylor Reed',
        totalPoints: 0,
        challengesCompleted: 0,
        averageScore: 0,
      });
    });

    test('throws AppError when model throws', async () => {
      Leaderboard.getGlobalLeaderboard.mockRejectedValue(new Error('DB fail'));
      await expect(leaderboardService.getTopPerformers(5)).rejects.toThrow(
        AppError,
      );
    });
  });
});

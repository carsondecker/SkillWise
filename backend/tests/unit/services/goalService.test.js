const Goal = require('../../../src/models/Goal');
const { AppError } = require('../../../src/middleware/errorHandler');

jest.mock('../../../src/models/Goal', () => ({
  create: jest.fn(),
}));

const goalService = require('../../../src/services/goalService');

describe('GoalService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createGoal', () => {
    test('creates a goal and trims title', async () => {
      Goal.create.mockResolvedValue({ id: 1, title: 'Title' });

      const result = await goalService.createGoal({
        userId: 2,
        title: '  Title ',
        description: '',
        category: 'General',
      });

      expect(Goal.create).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Title', user_id: 2 })
      );
      expect(result).toEqual({ id: 1, title: 'Title' });
    });

    test('throws AppError when title missing', async () => {
      await expect(
        goalService.createGoal({ userId: 1, title: '' })
      ).rejects.toBeInstanceOf(AppError);
    });
  });

  describe('calculateCompletion', () => {
    test('returns provided progress capped at 100', () => {
      expect(goalService.calculateCompletion({ progress_percentage: 80 })).toBe(
        80
      );
      expect(
        goalService.calculateCompletion({ progress_percentage: 150 })
      ).toBe(100);
    });

    test('returns 0 when progress not provided', () => {
      expect(goalService.calculateCompletion({})).toBe(0);
    });
  });
});

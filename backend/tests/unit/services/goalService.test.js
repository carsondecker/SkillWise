const Goal = require('../../../src/models/Goal');
const goalService = require('../../../src/services/goalService');
const { AppError } = require('../../../src/middleware/errorHandler');

jest.mock('../../../src/models/Goal', () => ({
  findByUserId: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
}));

describe('Goal Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getGoals', () => {
    test('returns goals with completion calculated', async () => {
      Goal.findByUserId.mockResolvedValue([
        { id: 1, progress_percentage: 40 },
        { id: 2, progress_percentage: 110 },
      ]);

      const res = await goalService.getGoals({
        userId: 5,
        limit: 10,
        offset: 0,
      });
      expect(Array.isArray(res)).toBe(true);
      expect(res[0]).toHaveProperty('completion', 40);
      // capped at 100
      expect(res[1]).toHaveProperty('completion', 100);
      expect(Goal.findByUserId).toHaveBeenCalledWith(5, 10, 0);
    });
  });

  describe('getGoalById', () => {
    test('returns goal if found and belongs to user', async () => {
      Goal.findById.mockResolvedValue({ id: 2, user_id: 7 });
      const g = await goalService.getGoalById({ userId: 7, goalId: 2 });
      expect(g).toHaveProperty('id', 2);
    });

    test('throws when goal not found or not owned', async () => {
      Goal.findById.mockResolvedValue({ id: 3, user_id: 9 });
      await expect(
        goalService.getGoalById({ userId: 5, goalId: 3 })
      ).rejects.toThrow(AppError);
    });
  });

  describe('createGoal', () => {
    test('throws validation error when title missing', async () => {
      await expect(
        goalService.createGoal({ userId: 1, title: '' })
      ).rejects.toThrow(AppError);
    });

    test('creates goal when valid', async () => {
      const newGoal = { id: 10, title: 'Learn', user_id: 1 };
      Goal.create.mockResolvedValue(newGoal);
      const res = await goalService.createGoal({ userId: 1, title: 'Learn' });
      expect(res).toEqual(newGoal);
      expect(Goal.create).toHaveBeenCalled();
    });
  });

  describe('updateGoal', () => {
    test('updates and returns updated goal', async () => {
      const updated = { id: 4, title: 'Updated' };
      Goal.update.mockResolvedValue(updated);
      const res = await goalService.updateGoal({
        userId: 1,
        goalId: 4,
        data: { title: 'Updated' },
      });
      expect(res).toEqual(updated);
    });

    test('throws when update returns falsy', async () => {
      Goal.update.mockResolvedValue(null);
      await expect(
        goalService.updateGoal({ userId: 1, goalId: 5, data: {} })
      ).rejects.toThrow(AppError);
    });
  });

  describe('deleteGoal', () => {
    test('deletes when exists', async () => {
      Goal.delete.mockResolvedValue({ id: 8 });
      const res = await goalService.deleteGoal({ userId: 1, goalId: 8 });
      expect(res).toHaveProperty('id', 8);
    });

    test('throws when not found', async () => {
      Goal.delete.mockResolvedValue(null);
      await expect(
        goalService.deleteGoal({ userId: 1, goalId: 9 })
      ).rejects.toThrow(AppError);
    });
  });

  describe('calculateCompletion', () => {
    test('returns progress_percentage when present', () => {
      const goal = { progress_percentage: 55 };
      expect(goalService.calculateCompletion(goal)).toBe(55);
    });

    test('returns 0 when no progress', () => {
      expect(goalService.calculateCompletion({})).toBe(0);
    });
  });
});

const goalService = require('../../../src/services/goalService');
const goalController = require('../../../src/controllers/goalController');

jest.mock('../../../src/services/goalService', () => ({
  getGoals: jest.fn(),
  getGoalById: jest.fn(),
  createGoal: jest.fn(),
  updateGoal: jest.fn(),
  deleteGoal: jest.fn(),
}));

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.end = jest.fn();
  return res;
};

describe('GoalController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getGoals returns list for user', async () => {
    goalService.getGoals.mockResolvedValue([{ id: 1 }]);
    const req = { user: { id: 5 }, query: { limit: 10, offset: 0 } };
    const res = mockRes();

    await goalController.getGoals(req, res);

    expect(goalService.getGoals).toHaveBeenCalledWith({
      userId: 5,
      limit: 10,
      offset: 0,
    });
    expect(res.json).toHaveBeenCalledWith({ goals: [{ id: 1 }] });
  });

  test('createGoal validates and delegates to service', async () => {
    goalService.createGoal.mockResolvedValue({ id: 2, title: 'New Goal' });
    const req = { user: { id: 1 }, body: { title: 'New Goal' } };
    const res = mockRes();

    await goalController.createGoal(req, res);

    expect(goalService.createGoal).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 1, title: 'New Goal' })
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Goal created successfully',
        goal: { id: 2, title: 'New Goal' },
      })
    );
  });
});

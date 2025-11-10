const goalController = require('../../../src/controllers/goalController');
const goalService = require('../../../src/services/goalService');

jest.mock('../../../src/services/goalService');

describe('GoalController', () => {
  afterEach(() => jest.clearAllMocks());

  test('GET /goals should return user goals', async () => {
    goalService.getGoals.mockResolvedValue([{ id: 1 }]);
    const req = { user: { id: 7 }, query: {} };
    const res = { json: jest.fn() };
    const next = jest.fn();

    await goalController.getGoals(req, res, next);
    expect(goalService.getGoals).toHaveBeenCalledWith({
      userId: 7,
      limit: 20,
      offset: 0,
    });
    expect(res.json).toHaveBeenCalledWith({ goals: [{ id: 1 }] });
  });

  test('POST /goals should create new goal', async () => {
    const created = { id: 5, title: 'Do it' };
    goalService.createGoal.mockResolvedValue(created);
    const req = { user: { id: 3 }, body: { title: 'Do it' } };
    const res = { status: jest.fn(() => res), json: jest.fn() };
    const next = jest.fn();

    await goalController.createGoal(req, res, next);
    expect(goalService.createGoal).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Goal created successfully',
      goal: created,
    });
  });

  test('POST /goals should call next with error when validation fails', async () => {
    const req = { user: { id: 3 }, body: { title: '' } };
    const res = { status: jest.fn(() => res), json: jest.fn() };
    const next = jest.fn();

    goalService.createGoal.mockRejectedValue(new Error('validation'));

    await goalController.createGoal(req, res, next);
    // allow async handler to call next
    await new Promise((r) => setImmediate(r));
    expect(next).toHaveBeenCalled();
  });
});

const challengeService = require('../../../src/services/challengeService');
const goalService = require('../../../src/services/goalService');
const challengeController = require('../../../src/controllers/challengeController');
const { AppError } = require('../../../src/middleware/errorHandler');

jest.mock('../../../src/services/challengeService', () => ({
  getChallenges: jest.fn(),
  getChallengeById: jest.fn(),
  createChallenge: jest.fn(),
  createChallengeForGoal: jest.fn(),
  getLatestSubmissionsForChallenge: jest.fn(),
}));

jest.mock('../../../src/services/goalService', () => ({
  getGoalById: jest.fn(),
}));

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.end = jest.fn();
  return res;
};

const runHandler = (handler, req, res, next) =>
  new Promise((resolve) => {
    handler(req, res, next);
    setImmediate(resolve);
  });

describe('ChallengeController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getChallenges forwards filters to service', async () => {
    challengeService.getChallenges.mockResolvedValue([{ id: 1 }]);
    const req = { query: { difficulty: 'easy' }, user: { id: 2 } };
    const res = mockRes();

    await runHandler(challengeController.getChallenges, req, res, jest.fn());

    expect(challengeService.getChallenges).toHaveBeenCalledWith(
      {
        difficulty: 'easy',
        category: undefined,
        limit: undefined,
        offset: undefined,
      },
      2
    );
    expect(res.json).toHaveBeenCalledWith({ challenges: [{ id: 1 }] });
  });

  test('getChallengeById returns error when challenge missing', async () => {
    challengeService.getChallengeById.mockResolvedValue(null);
    const req = { params: { id: '10' } };
    const res = mockRes();
    const next = jest.fn();

    await runHandler(challengeController.getChallengeById, req, res, next);

    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.code).toBe('NOT_FOUND');
  });

  test('createChallenge persists validated payload', async () => {
    challengeService.createChallenge.mockResolvedValue({ id: 5, title: 'New' });
    const req = {
      validated: {
        body: {
          title: 'New',
          category: 'gen',
          description: 'desc',
          instructions: 'do',
        },
      },
      user: { id: 3 },
    };
    const res = mockRes();

    await runHandler(challengeController.createChallenge, req, res, jest.fn());

    expect(challengeService.createChallenge).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'New', created_by: 3 })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('createChallengeForGoal validates goal ownership', async () => {
    goalService.getGoalById.mockResolvedValue({ id: 2, user_id: 4 });
    challengeService.createChallenge.mockResolvedValue({ id: 9, title: 'T' });
    const req = {
      params: { id: '2' },
      body: { title: 'T', description: 'D' },
      user: { id: 4 },
    };
    const res = mockRes();
    const next = jest.fn();

    await runHandler(
      challengeController.createChallengeForGoal,
      req,
      res,
      next
    );

    expect(goalService.getGoalById).toHaveBeenCalledWith({
      userId: 4,
      goalId: 2,
    });
    expect(challengeService.createChallenge).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('Challenge created'),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });
});

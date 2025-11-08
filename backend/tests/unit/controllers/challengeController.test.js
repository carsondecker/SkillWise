const challengeController = require('../../../src/controllers/challengeController');
const challengeService = require('../../../src/services/challengeService');

jest.mock('../../../src/services/challengeService');

describe('ChallengeController', () => {
  afterEach(() => jest.clearAllMocks());

  test('GET /challenges should return challenges with filters', async () => {
    const sample = [{ id: 1, title: 'Test' }];
    challengeService.getChallenges.mockResolvedValue(sample);
    const req = { query: {} };
    const res = { json: jest.fn() };
    const next = jest.fn();

    await challengeController.getChallenges(req, res, next);
    expect(challengeService.getChallenges).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ challenges: sample });
  });

  test('POST /challenges should create new challenge and return 201', async () => {
    const created = { id: 2, title: 'New' };
    challengeService.createChallenge.mockResolvedValue(created);
    const req = {
      body: {
        title: 'New',
        description: 'x',
        instructions: 'y',
        category: 'c',
      },
    };
    const res = { status: jest.fn(() => res), json: jest.fn() };
    const next = jest.fn();

    await challengeController.createChallenge(req, res, next);
    expect(challengeService.createChallenge).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Challenge created successfully',
      challenge: created,
    });
  });
});

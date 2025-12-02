const db = require('../../../src/database/connection');
const { AppError } = require('../../../src/middleware/errorHandler');

jest.mock('../../../src/database/connection', () => ({
  query: jest.fn(),
}));

const aiService = require('../../../src/services/aiService');

describe('AIService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.OPENAI_API_KEY;
  });

  describe('suggestChallenges', () => {
    test('throws when OpenAI key is missing', async () => {
      await expect(aiService.suggestChallenges({})).rejects.toBeInstanceOf(
        AppError
      );
    });
  });

  describe('gradeChallengeSubmission', () => {
    test('requires challengeId input', async () => {
      await expect(
        aiService.gradeChallengeSubmission({ userId: 1 })
      ).rejects.toBeInstanceOf(AppError);
      expect(db.query).not.toHaveBeenCalled();
    });
  });
});

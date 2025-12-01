const path = require('path');

describe('AI Service snapshots', () => {
  beforeEach(() => {
    // Ensure the module cache is cleared so our mocks take effect
    jest.resetModules();
    process.env.OPENAI_API_KEY = 'test-key';
  });

  test('generateChallenge returns expected structure (snapshot)', async () => {
    const sampleChallenge = {
      title: 'Implement binary search',
      description: 'Write a function that performs binary search on a sorted array.',
      instructions: 'Implement iterative binary search and handle edge cases.',
      category: 'algorithms',
      difficulty_level: 'easy',
      points_reward: 20,
      estimated_time_minutes: 45,
      prerequisites: ['Arrays', 'Basic Loops'],
      max_attempts: 3,
      requires_peer_review: false,
      tags: ['search','arrays'],
      learning_objectives: ['Implement binary search','Analyze time complexity']
    };

    // Mock OpenAI client to return a deterministic JSON payload
    const mockCreate = jest.fn().mockResolvedValue({
      choices: [
        { message: { content: JSON.stringify(sampleChallenge) } }
      ]
    });

    // Provide a mocked OpenAI constructor before importing the service
    jest.doMock('openai', () => {
      return jest.fn().mockImplementation(() => ({
        chat: { completions: { create: mockCreate } }
      }));
    });

    const aiService = require('../../../src/services/aiService');

    const goal = { title: 'Learn searching algorithms', description: 'Get comfortable with search techniques', category: 'algorithms', learning_objectives: ['binary search'] };

    const result = await aiService.generateChallenge(goal, { difficulty: 'easy' });

    expect(result).toMatchSnapshot();
    expect(mockCreate).toHaveBeenCalled();
  });

  test('evaluateSubmission returns expected evaluation (snapshot)', async () => {
    const sampleEval = {
      feedback: 'Good attempt. The solution handles typical cases but misses edge cases.',
      score: 72,
      rating_1_to_5: 4,
      suggestions: ['Add bounds checks','Write more unit tests','Handle empty input'],
      strengths: ['Correct algorithm choice','Readable code'],
      improvements: ['Edge case handling','Performance on large inputs'],
      detailed_analysis: [
        { area: 'logic', comment: 'Loop termination looks correct' },
        { area: 'style', comment: 'Consider consistent naming' }
      ],
      recommended_resources: [
        { title: 'Binary Search - Wikipedia', url: 'https://en.wikipedia.org/wiki/Binary_search' }
      ],
      confidence_score: 0.87
    };

    const mockCreate = jest.fn().mockResolvedValue({
      choices: [
        { message: { content: JSON.stringify(sampleEval) } }
      ]
    });

    jest.doMock('openai', () => {
      return jest.fn().mockImplementation(() => ({
        chat: { completions: { create: mockCreate } }
      }));
    });

    const aiService = require('../../../src/services/aiService');

    const submissionText = 'function binarySearch(arr, target) { /* ... */ }';

    const result = await aiService.evaluateSubmission(submissionText, { temperature: 0 });

    expect(result).toMatchSnapshot();
    expect(mockCreate).toHaveBeenCalled();
  });
});

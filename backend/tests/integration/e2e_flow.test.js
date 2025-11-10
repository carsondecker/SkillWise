const request = require('supertest');
const app = require('../../src/app');
const { clearTestData } = require('../setup');

describe('🌐 End-to-end: register → goal → challenge → complete', () => {
  beforeEach(async () => {
    await clearTestData();
  });

  test('✅ full flow updates goal progress after marking challenge complete', async () => {
    const agent = request.agent(app);

    const user = {
      email: 'e2e_user@example.com',
      password: 'E2eTest123!',
      firstName: 'E2E',
      lastName: 'Runner',
      confirmPassword: 'E2eTest123!',
    };

    // Register
    const reg = await agent.post('/api/auth/register').send(user);
    expect(reg.statusCode).toBe(201);
    expect(reg.body.user).toHaveProperty('email', user.email);

    // Login (agent keeps cookies)
    const login = await agent.post('/api/auth/login').send({
      email: user.email,
      password: user.password,
    });
    expect(login.statusCode).toBe(200);
    expect(login.body.user).toHaveProperty('email', user.email);

    // Create a goal
    const goalPayload = {
      title: 'E2E Test Goal',
      description: 'Goal for E2E flow',
    };

    const createGoal = await agent.post('/api/goals').send(goalPayload);
    expect(createGoal.statusCode).toBe(201);
    const goal = createGoal.body.goal;
    expect(goal).toHaveProperty('id');

    // Create a challenge linked to the goal
    const challengePayload = {
      title: 'E2E Challenge',
      description: 'Complete this challenge',
      instructions: 'Do the thing',
      category: 'e2e',
      difficulty_level: 'easy',
      relatedGoalId: goal.id,
    };

    const createChallenge = await agent
      .post('/api/challenges')
      .send(challengePayload);
    expect(createChallenge.statusCode).toBe(201);
    const challenge = createChallenge.body.challenge;
    expect(challenge).toHaveProperty('id');

    // Mark the challenge complete
    const completeRes = await agent.post(
      `/api/submissions/challenge/${challenge.id}/complete`
    );
    expect(completeRes.statusCode).toBe(201);

    // Fetch the goal and assert progress updated to 100 (one challenge completed)
    const fetchGoal = await agent.get(`/api/goals/${goal.id}`);
    expect(fetchGoal.statusCode).toBe(200);
    const fetched = fetchGoal.body.goal;
    // progress_percentage should be set by progressService.trackEvent
    expect(fetched).toHaveProperty('progress_percentage');
    expect(Number(fetched.progress_percentage)).toBeGreaterThanOrEqual(100);
  });
});

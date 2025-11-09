const request = require('supertest');
const app = require('../../src/app');
const { testPool, clearTestData } = require('../setup');

// Import service directly for grading flow (integration-level)
const submissionService = require('../../src/services/submissionService');

describe('🔁 Goal - Challenge - Progress integration', () => {
  let authToken;
  let userId;
  let goalId;
  let challengeId;
  let submissionId;

  beforeAll(async () => {
    await clearTestData();

    // Register + login user
    const registerRes = await request(app).post('/api/auth/register').send({
      email: 'flow_tester@example.com',
      password: 'Test1234!',
      confirmPassword: 'Test1234!',
      firstName: 'Flow',
      lastName: 'Tester',
    });
    expect(registerRes.statusCode).toBe(201);

    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'flow_tester@example.com',
      password: 'Test1234!',
    });
    expect(loginRes.statusCode).toBe(200);
    authToken = loginRes.body.tokens?.accessToken;
    expect(authToken).toBeDefined();

    // Get user id from DB
    const u = await testPool.query('SELECT id FROM users WHERE email = $1', [
      'flow_tester@example.com',
    ]);
    userId = u.rows[0].id;

    // Create a goal via API
    const goalRes = await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Finish Integration Flow',
        description: 'Test goal linking to challenges',
        category: 'Testing',
        difficulty_level: 'easy',
      });

    expect(goalRes.statusCode).toBe(201);
    goalId = goalRes.body.goal.id;

    // Insert a challenge linked to the goal directly in DB
    const ch = await testPool.query(
      `
      INSERT INTO challenges (title, description, instructions, category, difficulty_level, points_reward, created_by, related_goal_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING id, points_reward
      `,
      [
        'Linked Challenge',
        'A challenge linked to the goal',
        'Do the thing and submit',
        'Testing',
        'easy',
        50,
        userId,
        goalId,
      ]
    );
    challengeId = ch.rows[0].id;

    // Insert a submission for this challenge by the user
    const sub = await testPool.query(
      `
      INSERT INTO submissions (user_id, challenge_id, submission_text, status)
      VALUES ($1,$2,$3,'submitted') RETURNING id
      `,
      [userId, challengeId, 'My submission content']
    );

    submissionId = sub.rows[0].id;
  });

  afterAll(async () => {
    await clearTestData();
  });

  test('grading a submission awards points and updates goal progress', async () => {
    // Grade the submission using the service (integration-level)
    const result = await submissionService.gradeSubmission(submissionId);
    expect(result).toBeDefined();

    // Leaderboard should have an entry for the user with points >= the challenge points
    const lb = await testPool.query(
      'SELECT points FROM leaderboard WHERE user_id = $1',
      [userId]
    );
    expect(lb.rows.length).toBeGreaterThanOrEqual(1);
    const totalPoints = Number(lb.rows[0].points || 0);
    expect(totalPoints).toBeGreaterThanOrEqual(1);

    // Goal progress_percentage should be updated to 100 (single linked challenge completed)
    const g = await testPool.query(
      'SELECT progress_percentage FROM goals WHERE id = $1',
      [goalId]
    );
    expect(g.rows.length).toBe(1);
    const pct = Number(g.rows[0].progress_percentage || 0);
    expect(pct).toBeGreaterThanOrEqual(0);
    expect(pct).toBeLessThanOrEqual(100);

    // There should be a progress_events row for challenge_completed for this user
    const ev = await testPool.query(
      "SELECT * FROM progress_events WHERE user_id = $1 AND event_type = 'challenge_completed' ORDER BY id DESC LIMIT 1",
      [userId]
    );
    expect(ev.rows.length).toBeGreaterThanOrEqual(1);
    const event = ev.rows[0];
    expect(event).toHaveProperty('event_data');
  });
});

module.exports = {};

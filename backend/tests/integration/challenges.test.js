// tests/integration/challenges.test.js
const request = require('supertest');
const app = require('../../src/app');
const { testPool, clearTestData } = require('../setup');

describe('🧪 Challenges API Integration', () => {
  let authToken;
  let challengeId;

  beforeAll(async () => {
    // Clean any leftover data
    await clearTestData();

    // ✅ Register a user
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'challenge_tester@example.com',
        password: 'Test1234!',
        confirmPassword: 'Test1234!',
        firstName: 'Challenge',
        lastName: 'Tester',
      });

    expect(registerRes.statusCode).toBe(201);

    // ✅ Login to get token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'challenge_tester@example.com',
        password: 'Test1234!',
      });

    expect(loginRes.statusCode).toBe(200);
    authToken = loginRes.body.tokens?.accessToken;
    expect(authToken).toBeDefined();

    // ✅ Seed one challenge into the DB directly (if your API doesn’t yet support POST)
    const { rows } = await testPool.query(
      `
        INSERT INTO challenges (title, description, instructions, category, difficulty_level, points_reward)
        VALUES (
                 'React Basics',
                 'Learn React fundamentals',
                 'Complete the React beginner tutorial and submit a screenshot of your completed app.',
                 'Web Dev',
                 'medium',
                 100
               )
          RETURNING id
      `,
    );
    challengeId = rows[0].id;
  });

  afterAll(async () => {
    await clearTestData();
  });

  // ------------------------------
  // GET /api/challenges
  // ------------------------------
  describe('GET /api/challenges', () => {
    test('should return all available challenges', async () => {
      const res = await request(app)
        .get('/api/challenges')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.challenges)).toBe(true);
      expect(res.body.challenges.length).toBeGreaterThanOrEqual(1);

      const challenge = res.body.challenges[0];
      expect(challenge).toHaveProperty('title');
      expect(challenge).toHaveProperty('description');
      expect(challenge).toHaveProperty('difficulty_level');
    });
  });

  // ------------------------------
  // GET /api/challenges/:id
  // ------------------------------
  describe('GET /api/challenges/:id', () => {
    test('should return specific challenge by ID', async () => {
      const res = await request(app)
        .get(`/api/challenges/${challengeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('challenge');
      expect(res.body.challenge.id).toBe(challengeId);
      expect(res.body.challenge.title).toBe('React Basics');
    });

    test('should return 404 for invalid challenge ID', async () => {
      const res = await request(app)
        .get('/api/challenges/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(404);
    });
  });

  // ------------------------------
  // Unauthorized access test
  // ------------------------------
  describe('Unauthorized Access', () => {
    test('should return 401 if no auth token provided', async () => {
      const res = await request(app).get('/api/challenges');
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toMatch(/not logged in/i);
    });
  });
});

module.exports = {};

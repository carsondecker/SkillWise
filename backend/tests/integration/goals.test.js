// tests/integration/goals.test.js
const request = require('supertest');
const app = require('../../src/app');
const { testPool, clearTestData } = require('../setup');

describe('🎯 Goals API Integration', () => {
  let authToken;
  let goalId;

  beforeAll(async () => {
    await clearTestData();

    // ✅ Register a new user
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'goal_tester@example.com',
        password: 'Test1234!',
        confirmPassword: 'Test1234!',
        firstName: 'Goal',
        lastName: 'Tester',
      });

    expect(registerRes.statusCode).toBe(201);

    // ✅ Login to get token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'goal_tester@example.com',
        password: 'Test1234!',
      });

    expect(loginRes.statusCode).toBe(200);
    authToken = loginRes.body.tokens?.accessToken;
    expect(authToken).toBeDefined();
  });

  afterAll(async () => {
    await clearTestData();
  });

  // --------------------------------------------------
  // 1️⃣ Create Goal
  // --------------------------------------------------
  describe('POST /api/goals', () => {
    test('should create a new goal successfully', async () => {
      const res = await request(app)
        .post('/api/goals')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Complete Node.js Course',
          description: 'Finish the entire Node.js tutorial series',
          category: 'Learning',
          difficulty_level: 'medium',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.goal).toHaveProperty('id');
      expect(res.body.goal.title).toBe('Complete Node.js Course');
      goalId = res.body.goal.id;
    });
  });

  // --------------------------------------------------
  // 2️⃣ Get All Goals
  // --------------------------------------------------
  describe('GET /api/goals', () => {
    test('should return all goals for the authenticated user', async () => {
      const res = await request(app)
        .get('/api/goals')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.goals)).toBe(true);
      expect(res.body.goals.length).toBeGreaterThanOrEqual(1);
      expect(res.body.goals[0]).toHaveProperty('title');
      expect(res.body.goals[0]).toHaveProperty('difficulty_level');
    });

    test('should fail without auth token', async () => {
      const res = await request(app).get('/api/goals');
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toMatch(/not logged in/i);
    });
  });

  // --------------------------------------------------
  // 3️⃣ Update Goal Progress
  // --------------------------------------------------
  describe('PUT /api/goals/:id', () => {
    test('should update goal progress', async () => {
      const res = await request(app)
        .put(`/api/goals/${goalId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ progress_percentage: 70 });

      expect(res.statusCode).toBe(200);
      expect(res.body.goal.progress_percentage).toBe(70);
    });

    test('should return 404 for invalid goal id', async () => {
      const res = await request(app)
        .put('/api/goals/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ progress_percentage: 40 });

      expect(res.statusCode).toBe(404);
    });
  });

  // --------------------------------------------------
  // 4️⃣ Delete Goal
  // --------------------------------------------------
  describe('DELETE /api/goals/:id', () => {
    test('should delete a goal successfully', async () => {
      const res = await request(app)
        .delete(`/api/goals/${goalId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(204);

      // verify deletion
      const check = await request(app)
        .get(`/api/goals/${goalId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(check.statusCode).toBe(404);
    });
  });
});

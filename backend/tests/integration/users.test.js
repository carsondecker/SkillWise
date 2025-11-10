const request = require('supertest');
const app = require('../../src/app');
const { testPool, clearTestData } = require('../setup');

describe('🧪 Users API Integration', () => {
  let authToken;

  beforeAll(async () => {
    await clearTestData();

    // ✅ Register a test user
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'user_test@example.com',
        password: 'Test1234!',
        confirmPassword: 'Test1234!',
        firstName: 'Integration',
        lastName: 'User',
      });
    expect(registerRes.statusCode).toBe(201);

    // ✅ Login to obtain token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user_test@example.com',
        password: 'Test1234!',
      });
    expect(loginRes.statusCode).toBe(200);

    authToken = loginRes.body.tokens?.accessToken;
    expect(authToken).toBeDefined();
  });

  afterAll(async () => {
    await clearTestData();
  });

  // ------------------------------------------------
  // 1️⃣ GET /api/users/profile
  // ------------------------------------------------
  describe('GET /api/users/profile', () => {
    test('should return logged-in user profile', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.email).toBe('user_test@example.com');
      expect(res.body.user.first_name).toBeDefined();
      expect(res.body.user.last_name).toBeDefined();
    });

    test('should return 401 if unauthorized', async () => {
      const res = await request(app).get('/api/users/profile');
      expect(res.statusCode).toBe(401);
    });
  });

  // ------------------------------------------------
  // 2️⃣ PUT /api/users/profile
  // ------------------------------------------------
  describe('PUT /api/users/profile', () => {
    test('should update user profile successfully', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          first_name: 'UpdatedName',
          last_name: 'UpdatedLast',
          bio: 'Learning integration testing!',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.user.first_name).toBe('UpdatedName');
      expect(res.body.user.bio).toBe('Learning integration testing!');
    });

    test('should return 400 if payload invalid', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ first_name: '' }); // invalid (empty string)

      expect(res.statusCode).toBeGreaterThanOrEqual(400);
    });
  });

  // ------------------------------------------------
  // 3️⃣ GET /api/users/statistics
  // ------------------------------------------------
  describe('GET /api/users/statistics', () => {
    test('should return default statistics for new user', async () => {
      const res = await request(app)
        .get('/api/users/statistics')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.statistics).toHaveProperty('total_points');
      expect(res.body.statistics.total_points).toBe(0);
      expect(res.body.statistics.level).toBe(1);
    });
  });

  // ------------------------------------------------
  // 4️⃣ DELETE /api/users/profile
  // ------------------------------------------------
  describe('DELETE /api/users/profile', () => {
    test('should delete user account successfully', async () => {
      const res = await request(app)
        .delete('/api/users/account')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 204]).toContain(res.statusCode);
    });

    test('should return 401 when trying to delete without token', async () => {
      const res = await request(app).delete('/api/users/account');
      expect(res.statusCode).toBe(401);
    });
  });
});

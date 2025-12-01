const request = require('supertest');
const app = require('../../../src/app');
const db = require('../../../src/database/connection');

describe('🔐 Authentication Integration', () => {
  let testUser = {
    email: `testuser${Date.now()}@example.com`,
    password: 'Test1234!',
    firstName: 'Test',
    lastName: 'User',
    confirmPassword: 'Test1234!',
  };

  let tokens = {};

  afterAll(async () => {
    // Close DB pool if available
    if (db && typeof db.closePool === 'function') {
      await db.closePool();
    } else if (db && db.pool && typeof db.pool.end === 'function') {
      await db.pool.end();
    }
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(res.body).toHaveProperty('message', 'Registration successful');
      expect(res.body.user).toHaveProperty('email', testUser.email);
    });

    it('should fail for duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(400);

      expect(res.body.message).toMatch(/Email already registered/i);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login existing user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200);

      expect(res.body).toHaveProperty('message', 'Login successful');
      // Tokens are returned under `tokens` in the response
      tokens.accessToken = res.body.tokens && res.body.tokens.accessToken;
      tokens.refreshToken = res.body.tokens && res.body.tokens.refreshToken;
    });

    it('should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'WrongPass' })
        .expect(401);

      expect(res.body.message).toMatch(/Invalid email or password/i);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh a valid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${tokens.refreshToken}`])
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      // refresh token is returned via httpOnly cookie (Set-Cookie header)
      const setCookie = res.headers && res.headers['set-cookie'];
      expect(Array.isArray(setCookie)).toBe(true);
      const hasRefresh = setCookie.some((c) => String(c).includes('refreshToken='));
      expect(hasRefresh).toBe(true);
    });
  });
});

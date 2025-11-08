const request = require('supertest');
const app = require('../../../src/app');
const { testPool, clearTestData } = require('../../setup');

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
    await clearTestData();
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
      expect(res.body.tokens.accessToken).toBeDefined();
      expect(res.body.tokens.refreshToken).toBeDefined();
      tokens.accessToken = res.body.tokens.accessToken;
      tokens.refreshToken = res.body.tokens.refreshToken;
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

      expect(res.headers['set-cookie']).toBeDefined();

      const cookies = res.headers['set-cookie'].join(';');
      expect(cookies).toMatch(/refreshToken=/);
    });
  });
});

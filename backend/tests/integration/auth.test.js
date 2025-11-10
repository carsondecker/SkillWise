const request = require('supertest');
const app = require('../../src/app');
const { testPool, clearTestData } = require('../setup');

describe('🧪 Authentication Integration Tests', () => {
  beforeEach(async () => {
    await clearTestData();
  });


  const user = {
    email: 'test_user@example.com',
    password: 'Test1234!',
    firstName: 'Test',
    lastName: 'User',
    confirmPassword: 'Test1234!',
  };

  test('✅ Register a new user', async () => {
    const res = await request(app).post('/api/auth/register').send(user);
    expect(res.statusCode).toBe(201);
    expect(res.body.user.email).toBe(user.email);
  });

  test('✅ Login with valid credentials', async () => {
    await request(app).post('/api/auth/register').send(user);
    const res = await request(app).post('/api/auth/login').send({
      email: user.email,
      password: user.password,
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.user).toHaveProperty('email', user.email);
  });

  test('❌ Fail to login with invalid password', async () => {
    await request(app).post('/api/auth/register').send(user);
    const res = await request(app).post('/api/auth/login').send({
      email: user.email,
      password: 'wrongpass',
    });
    expect(res.statusCode).toBe(401);
  });
});

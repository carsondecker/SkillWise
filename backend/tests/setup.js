// TODO: Test environment setup and configuration
const { Pool } = require('pg');
// App-level DB connection will be required after we set TEST_DATABASE_URL
let appDb;

// Test database configuration
const testDbConfig = {
  connectionString:
    process.env.TEST_DATABASE_URL ||
    'postgresql://skillwise_user:skillwise_pass@localhost:5434/skillwise_test_db',
  // Reduce connections for test environment
  max: 5,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 1000,
};

// Ensure the app picks up the test database when required during tests
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    process.env.TEST_DATABASE_URL ||
    'postgresql://skillwise_user:skillwise_pass@localhost:5434/skillwise_test_db';
}

const testPool = new Pool(testDbConfig);

// Global test setup
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-only';

  // Ensure app uses the test DB connection string before it is required
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL =
      process.env.TEST_DATABASE_URL ||
      'postgresql://skillwise_user:skillwise_pass@localhost:5434/skillwise_test_db';
  }

  // Require app DB connection after env is set so it picks up test DB
  appDb = require('../src/database/connection');

  // Test database connection
  try {
    await testPool.query('SELECT 1');
    console.log('✅ Test database connected');
  } catch (err) {
    console.error('❌ Test database connection failed:', err.message);
    throw err;
  }
});

// Global test cleanup
afterAll(async () => {
  try {
    // Close app-level DB pool to avoid leaking connections when Jest runs suites
    try {
      await appDb.closePool();
      console.log('✅ App database pool closed');
    } catch (err) {
      console.warn('⚠️ Could not close app DB pool:', err.message);
    }

    // Close test pool
    await testPool.end();
    console.log('✅ Test database cleanup completed');
  } catch (err) {
    console.error('❌ Test cleanup failed:', err.message);
  }
});

// Helper function to clear test data between tests
const clearTestData = async () => {
  const tables = [
    'user_achievements',
    'achievements',
    'leaderboard',
    'progress_events',
    'peer_reviews',
    'ai_feedback',
    'submissions',
    'challenges',
    'goals',
    'refresh_tokens',
    'users',
  ];

  try {
    const tableList = tables.join(', ');
    await testPool.query(
      `TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`
    );
  } catch (err) {
    console.warn('Warning: Could not truncate tables:', err.message);
    // Fallback: try per-table truncate (best-effort)
    for (const table of tables) {
      try {
        await testPool.query(
          `TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`
        );
      } catch (innerErr) {
        console.warn(
          `Warning: Could not truncate table ${table}:`,
          innerErr.message
        );
      }
    }
  }
};

// Export test utilities
module.exports = {
  testPool,
  clearTestData,
};

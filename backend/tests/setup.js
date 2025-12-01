const { Pool } = require('pg');
const { execSync } = require('child_process');
require('dotenv').config({ path: '.env.test' });

// Allow skipping DB setup for fast unit tests by setting SKIP_DB_SETUP=true
const skipDbSetup = process.env.SKIP_DB_SETUP === 'true';
if (skipDbSetup) {
  console.log('⚠️  SKIP_DB_SETUP=true — skipping DB migrations and connections for tests');
  const noop = async () => {};
  module.exports = { testPool: null, clearTestData: noop };
} else {
  // Configure test pool
  const testPool = new Pool({
    connectionString: process.env.TEST_DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 2000,
  });

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    console.log('🧩 Setting up test database...');

    try {
      execSync('node scripts/migrate.js', { stdio: 'inherit' });
      await new Promise((resolve) => setTimeout(resolve, 1000)); // ⏳ wait 1s
      await testPool.query('SELECT 1');
      console.log('✅ Test DB ready');
    } catch (err) {
      console.error('❌ Migration or connection failed:', err.message);
      throw err;
    }
  });

  afterAll(async () => {
    console.log('🧹 Cleaning up...');
    await clearTestData();
    await testPool.end();
  });

  async function clearTestData () {
    const tables = [
      'user_statistics',
      'refresh_tokens',
      'goals',
      'users',
    ];

    for (const table of tables) {
      try {
        await testPool.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE;`);
      } catch {
        // Table might not exist in early migrations
      }
    }
  }

  module.exports = { testPool, clearTestData };
}

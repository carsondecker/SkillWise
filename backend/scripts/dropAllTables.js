#!/usr/bin/env node
/**
 * Drop all user tables from the connected PostgreSQL database.
 * ⚠️ WARNING: This deletes ALL data and schema objects (except system catalogs).
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://skillwise_user:skillwise_pass@localhost:5433/skillwise_db',
});

async function dropAllTables() {
  try {
    console.log('🚨 WARNING: Dropping all tables from database...');

    // Fetch all non-system tables (public schema only)
    const { rows } = await pool.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public';
    `);

    if (rows.length === 0) {
      console.log('✅ No user tables found.');
      return;
    }

    console.log(`🧱 Found ${rows.length} tables. Dropping...`);

    // Disable FK checks (optional safety)
    await pool.query('SET session_replication_role = replica;');

    for (const { tablename } of rows) {
      console.log(`🗑️  Dropping table: ${tablename}`);
      await pool.query(`DROP TABLE IF EXISTS "${tablename}" CASCADE;`);
    }

    // Re-enable FK checks
    await pool.query('SET session_replication_role = DEFAULT;');

    console.log('✅ All tables dropped successfully.');
  } catch (err) {
    console.error('❌ Failed to drop tables:', err.message);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  dropAllTables();
}

module.exports = { dropAllTables };

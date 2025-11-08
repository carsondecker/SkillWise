#!/usr/bin/env node
/**
 * Safe Migration Runner for PostgreSQL
 * Supports multi-statement SQL files (with DO $$ ... $$)
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://skillwise_user:skillwise_pass@localhost:5433/skillwise_db',
});

const migrationsDir = path.join(__dirname, '../database/migrations');

async function runMigrations() {
  console.log('🚀 Starting database migrations...\n');

  try {
    // Ensure migration tracking table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const executed = await pool.query(
        'SELECT 1 FROM migrations WHERE filename = $1',
        [file]
      );

      if (executed.rowCount > 0) {
        console.log(`⏭️  Skipping: ${file} (already applied)`);
        continue;
      }

      console.log(`🧩 Applying migration: ${file}`);

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

      try {
        // ⚙️ Use client.query directly (not pool.query) to support multi-statement execution
        const client = await pool.connect();
        await client.query('BEGIN;');
        await client.query(sql);
        await client.query('COMMIT;');
        client.release();

        await pool.query('INSERT INTO migrations (filename) VALUES ($1);', [
          file,
        ]);
        console.log(`✅ Completed: ${file}\n`);
      } catch (err) {
        console.error(`❌ Error in ${file}: ${err.message}`);
        console.error('📍 SQL Position:', err.position || 'N/A');
        console.error('⚠️ Severity:', err.severity || 'N/A');

        // rollback and abort
        try {
          await pool.query('ROLLBACK;');
        } catch {
          console.error('Migration failed:', err);
        }
        process.exit(1);
      }
    }

    console.log('🎉 All migrations executed successfully!');
  } catch (err) {
    console.error('🚨 Migration failed!');
    console.error('❗ Error Message:', err.message);
    console.error('🧠 Stack Trace:', err.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };

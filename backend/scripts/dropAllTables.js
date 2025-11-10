#!/usr/bin/env node
/**
 * 🔥 Drop all user-defined tables, triggers, and functions from the public schema.
 * ⚠️ WARNING: This will delete ALL user data and schema objects.
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://skillwise_user:skillwise_pass@localhost:5433/skillwise_db',
});

async function dropAllUserObjects() {
  try {
    console.log(
      '🚨 WARNING: Dropping all user-defined tables, triggers, and functions...'
    );

    // Disable FK checks
    await pool.query('SET session_replication_role = replica;');

    // 1️⃣ Drop all triggers from all tables
    const triggersRes = await pool.query(`
      SELECT event_object_table AS table_name, trigger_name
      FROM information_schema.triggers
      WHERE trigger_schema = 'public';
    `);

    if (triggersRes.rows.length) {
      console.log(`🧩 Found ${triggersRes.rows.length} triggers. Dropping...`);
      for (const { table_name, trigger_name } of triggersRes.rows) {
        console.log(`   🔻 Dropping trigger: ${trigger_name} ON ${table_name}`);
        await pool.query(
          `DROP TRIGGER IF EXISTS "${trigger_name}" ON "${table_name}" CASCADE;`
        );
      }
    } else {
      console.log('✅ No user triggers found.');
    }

    // 2️⃣ Drop all functions (procedures) in public schema
    const functionsRes = await pool.query(`
      SELECT routine_name
      FROM information_schema.routines
      WHERE specific_schema = 'public';
    `);

    if (functionsRes.rows.length) {
      console.log(
        `🧠 Found ${functionsRes.rows.length} functions. Dropping...`
      );
      for (const { routine_name } of functionsRes.rows) {
        console.log(`   🧨 Dropping function: ${routine_name}`);
        await pool
          .query(`DROP FUNCTION IF EXISTS "${routine_name}"() CASCADE;`)
          .catch(async () => {
            // Retry for overloaded functions
            await pool.query(
              `DROP FUNCTION IF EXISTS "${routine_name}" CASCADE;`
            );
          });
      }
    } else {
      console.log('✅ No user functions found.');
    }

    // 3️⃣ Drop all tables
    const tablesRes = await pool.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public';
    `);

    if (tablesRes.rows.length) {
      console.log(`🧱 Found ${tablesRes.rows.length} tables. Dropping...`);
      for (const { tablename } of tablesRes.rows) {
        console.log(`   🗑️  Dropping table: ${tablename}`);
        await pool.query(`DROP TABLE IF EXISTS "${tablename}" CASCADE;`);
      }
    } else {
      console.log('✅ No user tables found.');
    }

    // Re-enable FK checks
    await pool.query('SET session_replication_role = DEFAULT;');

    console.log('✅ All tables, triggers, and functions dropped successfully.');
  } catch (err) {
    console.error('❌ Error while dropping objects:', err.message);
  } finally {
    await pool.end();
  }
}

// Run script if called directly
if (require.main === module) {
  dropAllUserObjects();
}

module.exports = { dropAllUserObjects };

#!/usr/bin/env node
/**
 * SkillWise — Database Seeder
 * Seeds sample users, goals, challenges, and achievements
 */
require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');


const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
});

async function seedDatabase () {
  try {
    console.log('🌱 Starting database seeding...');
    const passwordHash = await bcrypt.hash('examplePassword', 10);


    // ------------------------------------------
    // USERS
    // ------------------------------------------
    console.log('👤 Seeding users...');
    await pool.query(`
      INSERT INTO users (first_name, last_name, email, password_hash, role, created_at)
      VALUES
        ('Alex', 'Johnson', 'alex@example.com', '${passwordHash}', 'user', NOW()),
        ('Taylor', 'Reed', 'taylor@example.com','${passwordHash}' , 'user', NOW()),
        ('Jordan', 'Miller', 'jordan@example.com', '${passwordHash}', 'admin', NOW())
      ON CONFLICT (email) DO NOTHING;
    `);

    // ------------------------------------------
    // GOALS
    // ------------------------------------------
    console.log('🎯 Seeding goals...');
    await pool.query(`
  INSERT INTO goals (user_id, title, description, category, difficulty_level, target_completion_date, created_at)
  VALUES
    (1, 'Master JavaScript', 'Complete all JS modules and projects.', 'Programming', 'medium', NOW() + interval '30 days', NOW()),
    (2, 'Improve SQL Skills', 'Learn advanced queries and indexing.', 'Database', 'hard', NOW() + interval '45 days', NOW()),
    (1, 'Build Portfolio', 'Create 3 full-stack apps.', 'Projects', 'medium', NOW() + interval '60 days', NOW())
  ON CONFLICT DO NOTHING;
`);

    // ------------------------------------------
    // CHALLENGES
    // ------------------------------------------
    console.log('⚡ Seeding challenges...');
    await pool.query(`
      INSERT INTO challenges (
        title,
        description,
        instructions,
        category,
        difficulty_level,
        estimated_time_minutes,
        points_reward,
        max_attempts,
        created_by,
        tags,
        learning_objectives,
        created_at
      )
      VALUES
        (
          'Array Manipulation',
          'Solve advanced array problems using JavaScript.',
          'Use methods like map, filter, reduce, and sort to manipulate arrays.',
          'Programming',
          'medium',
          45,
          50,
          3,
          1,
          ARRAY['javascript', 'arrays', 'algorithms'],
          ARRAY['Understand array iteration', 'Practice functional methods'],
          NOW()
        ),
        (
          'SQL Joins Mastery',
          'Practice complex SQL JOIN queries to combine data from multiple tables.',
          'Write queries using INNER JOIN, LEFT JOIN, and RIGHT JOIN operators.',
          'Database',
          'hard',
          60,
          80,
          3,
          2,
          ARRAY['sql', 'joins', 'databases'],
          ARRAY['Understand relationships between tables', 'Optimize join performance'],
          NOW()
        ),
        (
          'REST API Design',
          'Create a RESTful API following best practices in routing and error handling.',
          'Use Express.js to define routes, handle requests, and return JSON responses.',
          'Backend',
          'medium',
          90,
          70,
          2,
          1,
          ARRAY['express', 'api', 'http'],
          ARRAY['Design endpoints', 'Implement middleware', 'Return structured responses'],
          NOW()
        )
        ON CONFLICT DO NOTHING;
    `);

    // ------------------------------------------
    // ACHIEVEMENTS
    // ------------------------------------------
    console.log('🏆 Seeding achievements...');
    await pool.query(`
      INSERT INTO achievements (
        name,
        description,
        category,
        badge_icon,
        points_reward,
        criteria,
        created_at
      )
      VALUES
        (
          'First Challenge Completed',
          'Completed your first coding challenge successfully.',
          'Milestone',
          '🔥',
          100,
          '{"type": "challenge", "count": 1}'::jsonb,
          NOW()
        ),
        (
          'Goal Getter',
          'Successfully achieved a learning goal.',
          'Learning',
          '🎯',
          150,
          '{"type": "goal", "completed": true}'::jsonb,
          NOW()
        ),
        (
          'Streak Starter',
          'Maintained a 7-day learning streak.',
          'Consistency',
          '⚡',
          200,
          '{"type": "streak", "days": 7}'::jsonb,
          NOW()
        )
        ON CONFLICT DO NOTHING;
    `);

    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run when executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };

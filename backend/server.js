#!/usr/bin/env node
// ✅ SkillWise API — Server Entry Point
// Handles startup, graceful shutdown, and global error safety

const app = require('./src/app');
const logger = app.get('logger');
const { closePool, testConnection } = require('./src/database/connection');

const PORT = process.env.PORT || 3001;
const ENV = process.env.NODE_ENV || 'development';

// --------------------------------------------------
// 🚀 Start the Server
// --------------------------------------------------
(async () => {
  try {
    // Test DB connection before starting
    const connected = await testConnection();
    if (!connected) {
      logger.error('❌ Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // --------------------------------------------------
    // 🌱 Seed database in non-production environments
    // --------------------------------------------------
    try {
      if (ENV !== 'production') {
        // Allow the developer to skip seeding by setting SKIP_DB_SEED=true
        if (process.env.SKIP_DB_SEED !== 'true') {
          logger.info('🌱 Seeding database (development mode)');
          // require the seed script and run the exported seedDatabase function
          // scripts/seed.js uses its own PG pool and will exit cleanly after seeding
          // We intentionally await here so the server starts with seeded data.
          // eslint-disable-next-line global-require
          const { seedDatabase } = require('./scripts/seed');
          await seedDatabase();
          logger.info('✅ Database seeding complete');
        } else {
          logger.info('⏭️ SKIP_DB_SEED is set - skipping database seeding');
        }
      }
    } catch (seedErr) {
      // Don't fail startup on seed errors, just log a warning so devs can inspect
      logger.warn('⚠️ Database seeding failed:', seedErr?.message || seedErr);
    }

    const server = app.listen(PORT, () => {
      logger.info('==============================================');
      logger.info('🚀 SkillWise API Server is running');
      logger.info(`📡 Port:         ${PORT}`);
      logger.info(`🔒 Environment:  ${ENV}`);
      logger.info(`📊 Healthcheck:  http://localhost:${PORT}/healthz`);
      logger.info(`🌐 API Base:     http://localhost:${PORT}/api`);
      logger.info(`🕒 Started:      ${new Date().toLocaleString()}`);
      logger.info('==============================================');
    });

    // --------------------------------------------------
    // 🧹 Graceful Shutdown Logic
    // --------------------------------------------------
    const gracefulShutdown = async (signal) => {
      logger.info(`📴 Received ${signal}. Starting graceful shutdown...`);

      server.close(async (err) => {
        if (err) {
          logger.error('❌ Error during server shutdown:', err);
          process.exit(1);
        }

        try {
          await closePool();
          logger.info('✅ Database pool closed');
        } catch (dbErr) {
          logger.error('⚠️ Error closing database pool:', dbErr);
        }

        logger.info('✅ Server closed successfully. Goodbye 👋');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('⏰ Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // --------------------------------------------------
    // 🧯 Global Error Handling
    // --------------------------------------------------
    process.on('uncaughtException', (err) => {
      logger.error('💥 Uncaught Exception:', err);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

    module.exports = server;
  } catch (err) {
    logger.error('❌ Fatal startup error:', err);
    process.exit(1);
  }
})();

// src/app.js
// ✅ Main Express Application Setup
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const pino = require('pino');
const pinoHttp = require('pino-http');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');

// Middleware
const errorHandler = require('./middleware/errorHandler');

// Optional Sentry initialization (safe no-op when not configured)
require('./sentry');

// Routes
const routes = require('./routes/index');

// Create Express app
const app = express();
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use(cookieParser());
// --------------------------------------------------
// 🧩 Logger Setup
// --------------------------------------------------
const logger = pino({
  name: 'skillwise-api',
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV === 'development'
      ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
      : undefined,
});

// --------------------------------------------------
// 🧱 Middleware: Request Logging
// --------------------------------------------------
app.use(
  pinoHttp({
    logger,
    autoLogging: true,
    genReqId: () => crypto.randomUUID(),
    serializers: {
      req: (req) => ({
        id: req.id,
        method: req.method,
        url: req.url,
        userAgent: req.headers['user-agent'],
      }),
      res: (res) => ({
        statusCode: res.statusCode,
      }),
    },
  }),
);

// --------------------------------------------------
// 🛡️ Security Middleware
// --------------------------------------------------
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ['\'self\''],
        styleSrc: ['\'self\'', '\'unsafe-inline\''],
        scriptSrc: ['\'self\''],
        imgSrc: ['\'self\'', 'data:', 'https:'],
      },
    },
  }),
);

// Trust proxy (important for rate limiting behind proxies like Heroku)
app.set('trust proxy', 1);

// --------------------------------------------------
// 🌍 CORS Configuration
// --------------------------------------------------
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }),
);

// --------------------------------------------------
// 🚦 Rate Limiting
// --------------------------------------------------
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 min
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      status: 'fail',
      error: 'Too many requests, please try again later.',
      retryAfter: Math.ceil(
        (parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000) / 1000,
      ),
      timestamp: new Date().toISOString(),
    });
  },
});

app.use(limiter);

// --------------------------------------------------
// 📦 Body Parsers
// --------------------------------------------------
app.use(
  express.json({
    limit: '10mb',
    strict: true,
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb',
  }),
);

// --------------------------------------------------
// 💚 Health Check Endpoint
// --------------------------------------------------
app.get('/healthz', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'SkillWise API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
  });
});

// --------------------------------------------------
// 🧩 API Routes
// --------------------------------------------------
app.use('/api', routes);

// --------------------------------------------------
// 🚫 404 Handler
// --------------------------------------------------
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'fail',
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  });
});

// --------------------------------------------------
// ❗ Global Error Handler
// --------------------------------------------------
app.use(errorHandler);

// --------------------------------------------------
// 🧰 Expose logger
// --------------------------------------------------
app.set('logger', logger);

// --------------------------------------------------
// 🧩 Graceful Startup/Shutdown Logs
// --------------------------------------------------
process.on('SIGINT', () => {
  logger.info('🛑 Server shutting down gracefully (SIGINT)');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('🛑 Server shutting down gracefully (SIGTERM)');
  process.exit(0);
});

logger.info(`🚀 SkillWise API initialized at ${new Date().toISOString()}`);

module.exports = app;

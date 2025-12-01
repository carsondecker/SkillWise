// src/sentry.js
// Optional Sentry initialization. Safe to require even when no DSN is present.
// Exports a small wrapper with no-op functions when Sentry is disabled.
let sentry = null;
let enabled = false;

function init () {
  try {
    const dsn = process.env.SENTRY_DSN || process.env.SENTRY_URL || '';
    if (!dsn) {
      // Not configured — keep no-op behavior
      return;
    }

    const Sentry = require('@sentry/node');

    Sentry.init({
      dsn,
      environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
      release: process.env.npm_package_version || undefined,
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.0'),
      // Do not let Sentry modify process.exit behavior here — we only capture
      // and log. The app should control shutdown behavior.
      _experiments: { captureConsole: false },
    });

    // Attach handlers for unhandled rejections / exceptions so tests can notify Sentry
    process.on('unhandledRejection', (reason) => {
      try {
        Sentry.captureException(reason instanceof Error ? reason : new Error(String(reason)));
      } catch (e) {
        // swallow
      }
    });

    process.on('uncaughtException', (err) => {
      try {
        Sentry.captureException(err);
      } catch (e) {
        // swallow
      }
      // Do NOT call process.exit here. Let hosting environment decide.
    });

    sentry = Sentry;
    enabled = true;
  } catch (err) {
    // If Sentry package is missing or init fails, remain disabled but don't crash
    // Log to console so developer can see it during startup
    // eslint-disable-next-line no-console
    console.warn('Sentry initialization failed or not configured:', err.message || err);
    sentry = null;
    enabled = false;
  }
}

// Initialize immediately when required
init();

function captureException (err, ctx = {}) {
  if (!enabled || !sentry) return;
  try {
    if (ctx.request) {
      sentry.withScope((scope) => {
        scope.addEventProcessor((event) => sentry.Handlers.parseRequest(event, ctx.request));
        if (ctx.extra) {
          Object.keys(ctx.extra).forEach((k) => scope.setExtra(k, ctx.extra[k]));
        }
        sentry.captureException(err);
      });
    } else {
      sentry.captureException(err);
    }
  } catch (e) {
    // swallow
  }
}

function captureMessage (msg, level = 'error') {
  if (!enabled || !sentry) return;
  try {
    sentry.captureMessage(msg, level);
  } catch (e) {
    // swallow
  }
}

module.exports = {
  isEnabled: () => enabled,
  captureException,
  captureMessage,
  _sentry: () => sentry,
};

import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

const dsn = process.env.REACT_APP_SENTRY_DSN;

if (dsn) {
  const tracesSampleRate = Number(
    process.env.REACT_APP_SENTRY_TRACES_SAMPLE_RATE || '0.1'
  );

  Sentry.init({
    dsn,
    environment:
      process.env.REACT_APP_ENVIRONMENT ||
      process.env.NODE_ENV ||
      'development',
    integrations: [new BrowserTracing()],
    tracesSampleRate: Number.isFinite(tracesSampleRate)
      ? tracesSampleRate
      : 0.1,
  });
}

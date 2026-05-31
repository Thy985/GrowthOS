import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/browser';

export const initSentry = () => {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [
        new BrowserTracing({
          tracePropagationTargets: ['localhost', /^\//],
        }),
      ],
      environment: import.meta.env.MODE,
      release: import.meta.env.VITE_APP_VERSION || 'unknown',
      maxBreadcrumbs: 50,
      beforeSend(event) {
        if (import.meta.env.DEV) {
          console.log('[Sentry] Event captured:', event);
          return null;
        }
        return event;
      },
      beforeSendTransaction(transaction) {
        if (import.meta.env.DEV) {
          console.log('[Sentry] Transaction captured:', transaction);
          return null;
        }
        return transaction;
      },
      tracesSampleRate: 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });
  }
};

export const captureException = (error: Error, context?: Record<string, unknown>) => {
  if (import.meta.env.PROD) {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    console.error('[Sentry] Exception captured (dev mode):', error, context);
  }
};

export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  if (import.meta.env.PROD) {
    Sentry.captureMessage(message, level);
  } else {
    console.log(`[Sentry] Message captured (dev mode): [${level}] ${message}`);
  }
};

export const setUserContext = (user: { id: string, email?: string, username?: string }) => {
  if (import.meta.env.PROD) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
    });
  }
};

export const clearUserContext = () => {
  if (import.meta.env.PROD) {
    Sentry.setUser(null);
  }
};

export const addBreadcrumb = (
  message: string,
  category: string = 'custom',
  level: Sentry.SeverityLevel = 'info'
) => {
  if (import.meta.env.PROD) {
    Sentry.addBreadcrumb({
      message,
      category,
      level,
      timestamp: Date.now(),
    });
  }
};

export const withErrorBoundary = Sentry.withErrorBoundary;

export const withProfiler = Sentry.withProfiler;

export default {
  initSentry,
  captureException,
  captureMessage,
  setUserContext,
  clearUserContext,
  addBreadcrumb,
  withErrorBoundary,
  withProfiler,
};

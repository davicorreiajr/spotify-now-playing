const Sentry = require('@sentry/electron');
const { SENTRY_DSN } = require('./helpers/constants');

try {
  Sentry.init({
    dsn: SENTRY_DSN
  });
} catch (err) {
  // eslint-disable-next-line no-console
  console.log('Error initializing Sentry: ', err);
}

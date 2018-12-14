'use strict';
const Sentry = require('@sentry/electron');
const { ERROR_MESSAGES } = require('../helpers/constants');

exports.emit = function(errorMessageKey, error) {
  Sentry.captureEvent({
    message: ERROR_MESSAGES[errorMessageKey] || errorMessageKey,
    extra: { error }
  });
};

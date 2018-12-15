/* eslint-disable no-console */
'use strict';
const Sentry = require('@sentry/electron');
const isProduction = require('electron').app.isPackaged;
const { ERROR_MESSAGES } = require('../helpers/constants');

exports.emit = function(errorMessageKey, error) {
  const event = {
    message: ERROR_MESSAGES[errorMessageKey] || errorMessageKey,
    extra: { error }
  };

  isProduction ? Sentry.captureEvent(event) : console.log(event);
};

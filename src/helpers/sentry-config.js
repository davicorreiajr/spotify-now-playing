'use strict';
const Sentry = require('@sentry/electron');

exports.execute = function() {
  Sentry.configureScope((scope) => {
    scope.setUser({
      id: "john.doe@example.com"
    });
  });
};

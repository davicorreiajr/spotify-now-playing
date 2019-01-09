'use strict';
const Sentry = require('@sentry/electron');

exports.execute = function(user) {
  Sentry.configureScope((scope) => {
    scope.setUser({ id: user.uri });
    scope.setTag('user_country', user.country);
  });
};

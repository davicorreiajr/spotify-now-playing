'use strict';
require('../sentry');
const { app } = require('electron');

function getPath() {
  return app.getPath('userData');
}

const nconf = require('nconf').file({ file: getPath() + '/local-storage.json' });

exports.save = function(key, value) {
  nconf.set(key, value);
  nconf.save();
};

exports.get = function(key) {
  nconf.load();
  return nconf.get(key);
};

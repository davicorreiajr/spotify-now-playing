'use strict'
const { app } = require('electron');

function getPath() {
  return app.getPath('userData');
}

const nconf = require('nconf').file({ file: getPath() + '/token.json' });

exports.save = function(tokenKey, tokenValue) {
    nconf.set(tokenKey, tokenValue);
    nconf.save();
}

exports.get = function(tokenKey) {
    nconf.load();
    return nconf.get(tokenKey);
}

function getUserHome() {
  return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

const nconf = require('nconf').file({ file: getUserHome() + '/token.json' });

exports.save = function(tokenKey, tokenValue) {
    nconf.set(tokenKey, tokenValue);
    nconf.save();
}

exports.get = function(tokenKey) {
    nconf.load();
    return nconf.get(tokenKey);
}

'use strict';
const fetch = require('electron-fetch').default;

exports.getLatestVersion = function() {
  return fetch('https://api.github.com/repos/davicorreiajr/spotify-now-playing/releases/latest', {
    method: 'GET'
  })
    .then(res => res.json())
    .then(res => ({
      version: res.name
    }));
};

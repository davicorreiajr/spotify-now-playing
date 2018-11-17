'use strict'
const fetch = require('electron-fetch').default

exports.getCurrentPlayback = function(accessToken) {
  return fetch('https://api.spotify.com/v1/me/player', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })
      .then(res => res.json())
}

exports.getToken = function(body) {
  return fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      body: body.toString(),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
      .then(res => res.json())
}

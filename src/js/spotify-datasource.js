'use strict'
const fetch = require('electron-fetch').default

const SPOTIFY_CLIENT_ID = '331f622d406c476091927bd984a9ec8c';
const SPOTIFY_CLIENT_SECRET = '5f4ba55bb5364d1eb8d23ce6a0ff386c';

exports.getCurrentPlayback = function(accessToken) {
  return fetch('https://api.spotify.com/v1/me/player', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })
      .then(res => res.json());
}

exports.getToken = function(body) {
  body.append('client_id', SPOTIFY_CLIENT_ID);
  body.append('client_secret', SPOTIFY_CLIENT_SECRET);

  return fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      body: body.toString(),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
      .then(res => res.json());
}

exports.nextTrack = function(accessToken) {
  return fetch('https://api.spotify.com/v1/me/player/next', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
}

exports.previousTrack = function(accessToken) {
  return fetch('https://api.spotify.com/v1/me/player/previous', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
}

exports.play = function(accessToken) {
  return fetch('https://api.spotify.com/v1/me/player/play', {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
}

exports.pause = function(accessToken) {
  return fetch('https://api.spotify.com/v1/me/player/pause', {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
}

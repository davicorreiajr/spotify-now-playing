'use strict';
const fetch = require('electron-fetch').default;
const spotifyCodes = require('../../.env.json');
const localStorage = require('./local-storage');

const SPOTIFY_CLIENT_ID = spotifyCodes.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = spotifyCodes.SPOTIFY_CLIENT_SECRET;

exports.getCurrentPlayback = function(accessToken) {
  return fetch('https://api.spotify.com/v1/me/player', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${accessToken}` }
  })
    .then(res => res.json());
};

exports.getToken = function(body) {
  body.append('client_id', SPOTIFY_CLIENT_ID);
  body.append('client_secret', SPOTIFY_CLIENT_SECRET);

  return fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    body: body.toString(),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  })
    .then(res => res.json());
};

exports.nextTrack = function(accessToken) {
  return fetch('https://api.spotify.com/v1/me/player/next', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
};

exports.previousTrack = function(accessToken) {
  return fetch('https://api.spotify.com/v1/me/player/previous', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
};

exports.play = function(accessToken) {
  return fetch('https://api.spotify.com/v1/me/player/play', {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
};

exports.pause = function(accessToken) {
  return fetch('https://api.spotify.com/v1/me/player/pause', {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
};

exports.getPlaylists = function(accessToken) {
  return fetch('https://api.spotify.com/v1/me/playlists', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${accessToken}` }
  })
    .then(res => res.json())
    .then(data => {
      if(!data.items || !data.items[0]) return data;
      data.items = data.items.filter(playlist => playlist.collaborative || isPlaylistFromCurrentUser(playlist));
      return data;
    });
};

exports.addTrackToPlaylist = function(accessToken, playlistId, uri) {
  return fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?uris=${encodeURIComponent(uri)}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}` }
  })
    .then(res => res.json());
};

exports.addTrackToLibrary = function(accessToken, uri) {
  const id = uri.split(':').pop();
  return fetch(`https://api.spotify.com/v1/me/tracks?ids=${id}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
};

exports.getCurrentUser = function(accessToken) {
  return fetch('https://api.spotify.com/v1/me', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${accessToken}` }
  })
    .then(res => res.json());
};

function isPlaylistFromCurrentUser(playlist) {
  return playlist.owner.uri === localStorage.get('userUri');
}

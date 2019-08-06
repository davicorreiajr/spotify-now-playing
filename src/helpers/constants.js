'use strict';
const env = require('../../.env.json');

module.exports = {
  SPOTIFY_CLIENT_ID: env.SPOTIFY_CLIENT_ID,
  SPOTIFY_SCOPES: env.SPOTIFY_SCOPES,
  REDIRECT_URI: env.REDIRECT_URI,
  SENTRY_DSN: env.SENTRY_DSN,
  APP_NAME: 'Spotify - now playing',
  FEEDBACK_LINK: 'https://github.com/davicorreiajr/spotify-now-playing/issues/new',
  MAIN_WINDOW_WIDTH: 250,
  MAIN_WINDOW_HEIGHT: 150,
  UPDATER_WINDOW_WIDTH: 500,
  UPDATER_WINDOW_HEIGHT: 250,
  UPDATE_PERIOD: 750,
  SONG_TITLE_MAX_LENGTH: 25,
  ERROR_MESSAGES: {
    getCurrentPlayback: 'getCurrentPlayback',
    getSpotifyTokenFromAuthCode: 'getSpotifyTokenFromAuthCode',
    getSpotifyTokenFromRefreshToken: 'getSpotifyTokenFromRefreshToken',
    getSpotifyCurrentUser: 'getSpotifyCurrentUser',
    getPlaylists: 'getPlaylists',
    addTrackToPlaylist: 'addTrackToPlaylist',
    getAppLatestVersion: 'getAppLatestVersion',
    downloadAppLatestVersion: 'downloadAppLatestVersion'
  }
};

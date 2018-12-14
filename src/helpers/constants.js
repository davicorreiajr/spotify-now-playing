'use strict';
const spotifyCodes = require('../../.env.json');

module.exports = {
  SPOTIFY_CLIENT_ID: spotifyCodes.SPOTIFY_CLIENT_ID,
  SPOTIFY_SCOPES: spotifyCodes.SPOTIFY_SCOPES,
  REDIRECT_URI: spotifyCodes.REDIRECT_URI,
  APP_NAME: 'Spotify - now playing',
  FEEDBACK_LINK: 'https://github.com/davicorreiajr/spotify-now-playing/issues/new',
  MAIN_WINDOW_WIDTH: 250,
  MAIN_WINDOW_HEIGHT: 150,
  UPDATER_WINDOW_WIDTH: 500,
  UPDATER_WINDOW_HEIGHT: 250,
  UPDATE_PERIOD: 1500,
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

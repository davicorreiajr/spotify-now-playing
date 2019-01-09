'use strict';
require('../sentry');
const localStorage = require('../data-source/local-storage');
const spotifyDataSource = require('../data-source/spotify-datasource');
const subjectFactory = require('../helpers/subject-factory');
const errorReporter = require('../helpers/error-reporter');
const windowFactory = require('../helpers/window-factory');
const sentryConfig = require('../helpers/sentry-config');
const { SPOTIFY_SCOPES, REDIRECT_URI, SPOTIFY_CLIENT_ID } = require('../helpers/constants');

let authorizing;

exports.execute = function(parentWindow) {
  if(authorizing) return;
  authorizing = true;

  const subject = subjectFactory.get();
  subject.on('errorCurrentUser', handleErrorCurrentUser);
  subject.on('authCode', getTokenFromAuthCode);
  subject.on('token', getCurrentUser);
  subject.on('errorTokenFromRefreshToken', getAuthorization);
  subject.on('errorTokenFromAuthCode', getAuthorization);

  const accessToken = localStorage.get('accessToken');

  if(accessToken && areSavedScopesEnough()) {
    getCurrentUser(accessToken);
  } else {
    getAuthorization();
  }

  function getCurrentUser(token) {
    spotifyDataSource.getCurrentUser(token)
      .then(user => {
        if(user.uri) {
          localStorage.save('userUri', user.uri);
          sentryConfig.execute(user);
          authorizing = false;
        } else {
          subject.emit('errorCurrentUser', null);
        }
      })
      .catch(error => errorReporter.emit('getSpotifyCurrentUser', error));
  }

  function handleErrorCurrentUser() {
    const refreshToken = localStorage.get('refreshToken');
    
    if(!refreshToken) getAuthorization();
    getTokenFromRefreshToken(refreshToken);
  }

  function getAuthorization() {
    const spotifyAuthWindow = windowFactory.get('auth', { parentWindow });
    const spotifyAuthUrl = `https://accounts.spotify.com/en/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURI(SPOTIFY_SCOPES)}`;
    spotifyAuthWindow.loadURL(spotifyAuthUrl);

    spotifyAuthWindow.once('ready-to-show', () => spotifyAuthWindow.show());
    
    const webContents = spotifyAuthWindow.webContents;
    webContents.on('did-finish-load', () => {
      const url = webContents.getURL();
      const urlQueryParams = url.split('?')[1] || '';
      const urlSearchParams = new URLSearchParams(urlQueryParams);
      const code = urlSearchParams.get('code');

      if(isDomainUrlRedirectUri(url.split('?')[0]) && code) {
        spotifyAuthWindow.destroy();
        
        const authCode = code.split('#')[0];
        subject.emit('authCode', authCode);
      }
    });
  }

  function getTokenFromAuthCode(authCode) {
    const body = new URLSearchParams();
    body.append('grant_type', 'authorization_code');
    body.append('code', authCode);
    body.append('redirect_uri', REDIRECT_URI);

    spotifyDataSource.getToken(body)
      .then(json => {
        if(json.access_token) {
          localStorage.save('accessToken', json.access_token);
          localStorage.save('refreshToken', json.refresh_token);
          localStorage.save('authorizedScopes', json.scope);
          subject.emit('token', json.access_token);
        } else {
          subject.emit('errorTokenFromAuthCode', null);
        }
      })
      .catch(error => errorReporter.emit('getSpotifyTokenFromAuthCode', error));
  }

  function getTokenFromRefreshToken(refreshToken) {
    const body = new URLSearchParams();
    body.append('grant_type', 'refresh_token');
    body.append('refresh_token', refreshToken);

    spotifyDataSource.getToken(body)
      .then(json => {
        if(json.access_token) {
          localStorage.save('accessToken', json.access_token);
          if(json.refresh_token) localStorage.save('refreshToken', json.refresh_token);
          subject.emit('token', json.access_token);
        } else {
          subject.emit('errorTokenFromRefreshToken', null);
        }
      })
      .catch(error => errorReporter.emit('getSpotifyTokenFromRefreshToken', error));
  }
};

function isDomainUrlRedirectUri(domainUrl) {
  return domainUrl === REDIRECT_URI;
}

function areSavedScopesEnough() {
  const savedScopes = localStorage.get('authorizedScopes');
  if(!savedScopes) return false;

  const savedScopesArray = savedScopes.split(' ');
  const appScopesArray = SPOTIFY_SCOPES.split(' ');

  return appScopesArray.reduce((result, scope) => result && savedScopesArray.includes(scope), true);
}

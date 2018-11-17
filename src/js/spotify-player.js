'use strict'
const { BrowserWindow } = require('electron');
const token = require('./token');
const spotifyDataSource = require('./spotify-datasource');

const SPOTIFY_CLIENT_ID = '331f622d406c476091927bd984a9ec8c';
const SPOTIFY_SCOPES = 'user-read-playback-state user-read-private';
const REDIRECT_URI = 'https://example.com/callback';

function createWindow(window) {
  return new BrowserWindow(
    {
      parent: window,
      modal: true,
      show: false,
      alwaysOnTop: true,
      webPreferences: {
        nodeIntegration: false,
        devTools: true
      }
    }
  );
}

function isDomainUrlRedirectUri(domainUrl) {
  return domainUrl === REDIRECT_URI;
}

function getSubject() {
  let listeners = {};

  function on(eventType, callback) {
    listeners[eventType] = listeners[eventType] || [];
    listeners[eventType].push(callback);
  }

  function emit(eventType, data) {
    const callbacks = listeners[eventType];
    if(!callbacks) return;
    callbacks.forEach(callback => callback(data));
  }

  return {
    on,
    emit
  }
}

exports.execute = function(parentWindow) {
  const UPDATE_PERIOD = 1500;
  const subject = getSubject();
  let updateLoop;

  subject.on('authCode', getTokenFromAuthCode);
  subject.on('token', startUpdateLoop);
  subject.on('currentPlayback', function(currentPlayback) {
    console.log(currentPlayback);
  });
  subject.on('errorCurrentPlayback', handleErrorCurrentPlayback)
  subject.on('errorTokenFromRefreshToken', getAuthorization)
  subject.on('errorTokenFromAuthCode', getAuthorization)

  const accessToken = token.get('accessToken');

  if(accessToken) {
    startUpdateLoop(accessToken);
  } else {
    getAuthorization();
  }

  function startUpdateLoop(accessToken) {
    updateLoop = setInterval(() => getCurrentPlayback(accessToken), UPDATE_PERIOD);
  }
  
  function getCurrentPlayback(accessToken) {
    spotifyDataSource.getCurrentPlayback(accessToken)
      .then(json => {
        if(json.item) {
          subject.emit('currentPlayback', json);
        } else {
          subject.emit('errorCurrentPlayback', null);
        }
      });
  }

  function handleErrorCurrentPlayback() {
    if(updateLoop) clearInterval(updateLoop);
    updateLoop = null;

    const refreshToken = token.get('refreshToken');
    
    if(!refreshToken) getAuthorization();
    getTokenFromRefreshToken(refreshToken);
  }

  function getAuthorization() {
    const spotifyAuthWindow = createWindow(parentWindow);
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
    })
  }

  function getTokenFromAuthCode(authCode) {
    const body = new URLSearchParams();
    body.append('grant_type', 'authorization_code');
    body.append('code', authCode);
    body.append('redirect_uri', REDIRECT_URI);

    spotifyDataSource.getToken(body)
      .then(json => {
        if(json.access_token) {
          token.save('accessToken', json.access_token);
          token.save('refreshToken', json.refresh_token);
          subject.emit('token', json.access_token);
        } else {
          subject.emit('errorTokenFromAuthCode', null);
        }
      });
  }

  function getTokenFromRefreshToken(refreshToken) {
    const body = new URLSearchParams();
    body.append('grant_type', 'refresh_token');
    body.append('refresh_token', refreshToken);

    spotifyDataSource.getToken(body)
      .then(json => {
        if(json.access_token) {
          token.save('accessToken', json.access_token);
          if(json.refresh_token) token.save('refreshToken', json.refresh_token);
          subject.emit('token', json.access_token);
        } else {
          subject.emit('errorTokenFromRefreshToken', null);
        }
      });
  }
}

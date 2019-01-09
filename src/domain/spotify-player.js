'use strict';
require('../sentry');
const { ipcMain } = require('electron');
const localStorage = require('../data-source/local-storage');
const spotifyDataSource = require('../data-source/spotify-datasource');
const subjectFactory = require('../helpers/subject-factory');
const windowFactory = require('../helpers/window-factory');
const mappers = require('../helpers/mappers');
const errorReporter = require('../helpers/error-reporter');
const { UPDATE_PERIOD, SPOTIFY_CLIENT_ID, SPOTIFY_SCOPES, REDIRECT_URI } = require('../helpers/constants');
const notifier = require('node-notifier');

ipcMain.on('shuffleButtonClicked', () => spotifyDataSource.shuffle(localStorage.get('accessToken'), true));
ipcMain.on('unshuffleButtonClicked', () => spotifyDataSource.shuffle(localStorage.get('accessToken'), false));
ipcMain.on('previousButtonClicked', () => spotifyDataSource.previousTrack(localStorage.get('accessToken')));
ipcMain.on('nextButtonClicked', () => spotifyDataSource.nextTrack(localStorage.get('accessToken')));
ipcMain.on('pauseButtonClicked', () => spotifyDataSource.pause(localStorage.get('accessToken')));
ipcMain.on('playButtonClicked', () => spotifyDataSource.play(localStorage.get('accessToken')));
ipcMain.on('addToLibraryClicked', (event, uri) => {
  const accessToken = localStorage.get('accessToken');
  spotifyDataSource.addTrackToLibrary(accessToken, uri);
});

let currentPlaybackURI;

exports.execute = function(parentWindow) {
  const subject = subjectFactory.get();
  let updateLoop;

  subject.on('authCode', getTokenFromAuthCode);
  subject.on('token', startUpdateLoop);
  subject.on('currentPlaybackReceived', (data) => sendToRendererProcess('currentPlaybackReceived', data));
  subject.on('errorCurrentPlayback', handleErrorCurrentPlayback);
  subject.on('errorTokenFromRefreshToken', getAuthorization);
  subject.on('errorTokenFromAuthCode', getAuthorization);

  ipcMain.on('addToPlaylistButtonClicked', handleAddToPlaylistButtonClicked);
  ipcMain.on('playlistSelected', (event, data) => handlePlaylistSelected(data));

  const accessToken = localStorage.get('accessToken');

  if(accessToken && areSavedScopesEnough()) {
    startUpdateLoop(accessToken);
  } else {
    getAuthorization();
  }

  function startUpdateLoop(accessToken) {
    updateLoop = setInterval(() => getCurrentPlayback(accessToken), UPDATE_PERIOD);
  }

  function sendToRendererProcess(channel, data) {
    parentWindow.webContents.send(channel, data);
  }

  function shouldShowTrackNotification(data) {
    return data.currentlyPlayingType === 'track' && (data.uri !== currentPlaybackURI) && localStorage.get('activateNotifications');
  }

  function getCurrentPlayback(accessToken) {
    spotifyDataSource.getCurrentPlayback(accessToken)
      .then(json => {
        if(json.item) {
          const mappedData = mappers.currentPlaybackToView(json);
          subject.emit('currentPlaybackReceived', mappedData);  
          if(shouldShowTrackNotification(mappedData)) {
            currentPlaybackURI = mappedData.uri;
            notifier.notify(mappers.notificationData(json));
          }
        } else {
          sendToRendererProcess('loading', {});
          subject.emit('errorCurrentPlayback', null);
        }
      })
      .catch(error => {
        errorReporter.emit('getCurrentPlayback', error);
        sendToRendererProcess('noContent');
      });
  }

  function handleErrorCurrentPlayback() {
    if(updateLoop) clearInterval(updateLoop);
    updateLoop = null;

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

          spotifyDataSource.getCurrentUser(json.access_token)
            .then(user => {
              localStorage.save('userUri', user.uri);
              subject.emit('token', json.access_token);
            })
            .catch(error => errorReporter.emit('getSpotifyCurrentUser', error));
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

  function handleAddToPlaylistButtonClicked() {
    const accessToken = localStorage.get('accessToken');
    spotifyDataSource.getPlaylists(accessToken)
      .then(data => {
        const mappedData = mappers.playlistsToView(data);
        sendToRendererProcess('playlistsReceived', mappedData);
      })
      .catch(error => errorReporter.emit('getPlaylists', error));
  }

  function handlePlaylistSelected(data) {
    const accessToken = localStorage.get('accessToken');
    const { playlistId, uri } = data;
    spotifyDataSource.addTrackToPlaylist(accessToken, playlistId, uri)
      .then(response => response.error ? getAuthorization() : sendToRendererProcess('trackAdded'))
      .catch(error => errorReporter.emit('addTrackToPlaylist', error));
  }

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
};

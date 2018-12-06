'use strict';
const { ipcMain } = require('electron');
const localStorage = require('../data-source/local-storage');
const spotifyDataSource = require('../data-source/spotify-datasource');
const spotifyCodes = require('../../.env.json');
const subjectCreator = require('../helpers/subject');
const windowFactory = require('../helpers/window-factory');

const SPOTIFY_CLIENT_ID = spotifyCodes.SPOTIFY_CLIENT_ID;
const SPOTIFY_SCOPES = spotifyCodes.SPOTIFY_SCOPES;
const REDIRECT_URI = spotifyCodes.REDIRECT_URI;

function isDomainUrlRedirectUri(domainUrl) {
  return domainUrl === REDIRECT_URI;
}

function mapCurrentPlaybackToView(data) {
  const albumImage = data.item.album.images[0];
  const albumImageSrc = albumImage ? albumImage.url : '';

  return {
    albumImageSrc,
    albumName: data.item.album.name,
    artistName: data.item.artists[0].name,
    musicName: data.item.name,
    musicDuration: data.item.duration_ms,
    currentProgress: data.progress_ms,
    isPlaying: data.is_playing,
    uri: data.item.uri
  };
}

function mapPlaylistsToView(data) {
  if(!data.items) return;
  return data.items.map(item => ({
    name: item.name,
    id: item.id
  }));
}

function areSavedScopesEnough() {
  const savedScopes = localStorage.get('authorizedScopes');
  if(!savedScopes) return false;

  const savedScopesArray = savedScopes.split(' ');
  const appScopesArray = SPOTIFY_SCOPES.split(' ');

  return appScopesArray.reduce((result, scope) => result && savedScopesArray.includes(scope), true);
}

ipcMain.on('previousButtonClicked', () => spotifyDataSource.previousTrack(localStorage.get('accessToken')));
ipcMain.on('nextButtonClicked', () => spotifyDataSource.nextTrack(localStorage.get('accessToken')));
ipcMain.on('pauseButtonClicked', () => spotifyDataSource.pause(localStorage.get('accessToken')));
ipcMain.on('playButtonClicked', () => spotifyDataSource.play(localStorage.get('accessToken')));
ipcMain.on('addToLibraryClicked', (event, uri) => {
  const accessToken = localStorage.get('accessToken');
  spotifyDataSource.addTrackToLibrary(accessToken, uri);
});

exports.execute = function(parentWindow) {
  const UPDATE_PERIOD = 1500;
  const subject = subjectCreator.create();
  let updateLoop;

  subject.on('authCode', getTokenFromAuthCode);
  subject.on('token', startUpdateLoop);
  subject.on('currentPlaybackReceived', (data) => sendToRendererProcess('currentPlaybackReceived', data));
  subject.on('errorCurrentPlayback', handleErrorCurrentPlayback);
  subject.on('errorTokenFromRefreshToken', getAuthorization);
  subject.on('errorTokenFromAuthCode', getAuthorization);

  ipcMain.on('addToPlaylistButtonClicked', () => {
    const accessToken = localStorage.get('accessToken');
    spotifyDataSource.getPlaylists(accessToken)
      .then(data => {
        if(data.items) {
          const mappedData = mapPlaylistsToView(data);
          sendToRendererProcess('playlistsReceived', mappedData);
        } else {
          getAuthorization();
        }
      });
  });
  ipcMain.on('playlistSelected', (event, data) => {
    const accessToken = localStorage.get('accessToken');
    const { playlistId, uri } = data;
    spotifyDataSource.addTrackToPlaylist(accessToken, playlistId, uri)
      .then(response => response.error ? getAuthorization() : sendToRendererProcess('trackAdded'));
  });

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
  
  function getCurrentPlayback(accessToken) {
    spotifyDataSource.getCurrentPlayback(accessToken)
      .then(json => {
        if(json.item) {
          const mappedData = mapCurrentPlaybackToView(json);
          subject.emit('currentPlaybackReceived', mappedData);
        } else {
          sendToRendererProcess('loading', {});
          subject.emit('errorCurrentPlayback', null);
        }
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
    const spotifyAuthWindow = windowFactory.get('main-player', parentWindow);
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
            });
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
          localStorage.save('accessToken', json.access_token);
          if(json.refresh_token) localStorage.save('refreshToken', json.refresh_token);
          subject.emit('token', json.access_token);
        } else {
          subject.emit('errorTokenFromRefreshToken', null);
        }
      });
  }
};

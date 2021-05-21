'use strict';
require('../sentry');
const { ipcMain } = require('electron');
const localStorage = require('../data-source/local-storage');
const spotifyDataSource = require('../data-source/spotify-datasource');
const mappers = require('../helpers/mappers');
const errorReporter = require('../helpers/error-reporter');
const authorizer = require('./authorizer');
const { SONG_TITLE_MAX_LENGTH, UPDATE_PERIOD } = require('../helpers/constants');
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

exports.execute = function(parentWindow, tray) {
  ipcMain.on('addToPlaylistButtonClicked', handleAddToPlaylistButtonClicked);
  ipcMain.on('playlistSelected', (event, data) => handlePlaylistSelected(data));

  setInterval(() => getCurrentPlayback(), UPDATE_PERIOD);

  let index = 0;
  
  function getCurrentPlayback() {
    const accessToken = localStorage.get('accessToken');

    spotifyDataSource.getCurrentPlayback(accessToken)
      .then(json => {
        if(json.item) {
          const mappedData = mappers.currentPlaybackToView(json);
          if(shouldShowTrackNotification(mappedData)) {
            notifier.notify(
              mappers.notificationData(mappedData), function(error, response, metadata) {
                const keyExists = Object.prototype.hasOwnProperty.call(metadata, 'activationType');
                if(keyExists && metadata['activationType'] === 'actionClicked') {
                  spotifyDataSource.nextTrack(localStorage.get('accessToken'));
                }
              }
            );
          }
          if(shouldShowSongMenubar()) {
            const title = `${mappedData.artistName} - ${mappedData.musicName} - ${mappedData.albumName}`;

            if(title.length <= SONG_TITLE_MAX_LENGTH) {
              tray.setTitle(title);
            } else {
              if(didSongChange(mappedData)) {
                index = 0;
              }

              tray.setTitle(title.substring(index, index + (SONG_TITLE_MAX_LENGTH - 1)));
              index = (index + 1) % (title.length - SONG_TITLE_MAX_LENGTH + 2);
            }
          }
          currentPlaybackURI = mappedData.uri;
          sendToRendererProcess('currentPlaybackReceived', mappedData);
        } else {
          sendToRendererProcess('loading', {});
          authorizer.execute(parentWindow);
        }
      })
      .catch(error => {
        errorReporter.emit('getCurrentPlayback', error);
        sendToRendererProcess('noContent');
      });
  }

  function sendToRendererProcess(channel, data) {
    parentWindow.webContents.send(channel, data);
  }

  function didSongChange(data) {
    return data.uri !== currentPlaybackURI;
  }

  function shouldShowTrackNotification(data) {
    return data.currentlyPlayingType === 'track' && didSongChange(data) && localStorage.get('activateNotifications');
  }

  function shouldShowSongMenubar() {
    return localStorage.get('songMenubar');
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
      .then(response => response.error ? authorizer.execute(parentWindow) : sendToRendererProcess('trackAdded'))
      .catch(error => errorReporter.emit('addTrackToPlaylist', error));
  }
};

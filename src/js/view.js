'use strict';
const { ipcRenderer } = require('electron');
const currentWindow = require('electron').remote.getCurrentWindow();
let currentUriOfAddPage;

ipcRenderer.on('currentPlaybackReceived', (event, message) => setPlayer(message));
ipcRenderer.on('loading', () => setLoader());
ipcRenderer.on('playlistsReceived', (event, playlists) => openPlaylistsContainer(playlists));
ipcRenderer.on('trackAdded', () => closePlaylistsContainer());
currentWindow.on('hide', () => {
  hide('add-container');
  show('player-container');
});

function getPlayerTemplate(data) {
  return `
    <div class="spacement-bottom-md">
      <img src="${data.albumImageSrc}" class="album-cover">
    </div>
    <p class="spacement-bottom-sm music-name">${data.musicName}</p>
    <p class="spacement-bottom-sm album-name">${data.albumName}</p>
    <p class="spacement-bottom-lg">${data.artistName}</p>
    <div class="spacement-bottom-lg progress-bar-container">
      <div id="progress-bar" class="progress-bar"></div>
    </div>
    <div class="player-controls">
      <div id="previous-button" class="control-icon-container"><i class="fas fa-step-backward control-icon"></i></div>
      <div id="play-button" class="play-container"><i class="fas ${data.isPlaying ? 'fa-pause pause-icon' : 'fa-play play-icon'}"></i></div>
      <div id="next-button" class="control-icon-container"><i class="fas fa-step-forward control-icon"></i></div>
      <div id="add-button" class="add-icon-container"><i class="fas fa-plus control-icon"></i></div>
    </div>
  `;
}

function getAddTemplate() {
  return `
    <div id="add-back-button" class="add-option-container spacement-bottom-xl">
      <i class="fas fa-chevron-left control-icon text-color-secondary"></i>
      <p class="spacement-left-lg text-color-secondary">Back</p>
    </div>
    <p id="add-save-button" class="add-option-container spacement-bottom-md">Save to Your Library</p>
    <div id="add-playlist-button" class="add-option-container">
      <i id="add-playlist-icon" class="fas fa-chevron-right control-icon"></i>
      <p class="spacement-left-lg">Add to Playlist</p>
    </div>
    <div id="playlists-container" class="playlists-container" style="display: none"></div>
  `;
}

function getPlaylistTemplate(data) {
  return `
    <p id="playlist-${data.id}" class="spacement-left-lg spacement-top-md text-align-left">${data.name}</p>
  `;
}

function show(containerId) {
  const container = document.getElementById(containerId);
  container.style.display = 'block';
}

function hide(containerId) {
  const container = document.getElementById(containerId);
  container.style.display = 'none';
}

function fixWindowHeight() {
  const height = document.body.scrollHeight;
  ipcRenderer.send('fixHeight', height);
}

function setPlayer(data, force = false) {
  if(document.getElementById('add-container').style.display === 'block' && !force) return;

  hide('loader-container');
  show('player-container');

  const playerContainer = document.getElementById('player-container');
  playerContainer.innerHTML = getPlayerTemplate(data);
  setProgressBar(data.currentProgress, data.musicDuration);
  setPlayerButtonsListeners(data);
  fixWindowHeight();
}

function setLoader() {
  hide('player-container');
  hide('add-container');
  show('loader-container');
  fixWindowHeight();
}

function setProgressBar(currentProgress, musicDuration) {
  const progressBar = document.getElementById('progress-bar');
  const progress = (currentProgress / musicDuration) * 100;
  progressBar.style.width = `${progress}%`;
}

function setPlayerButtonsListeners(data) {
  document.getElementById('previous-button')
    .addEventListener('click', () => ipcRenderer.send('previousButtonClicked'));

  document.getElementById('next-button')
    .addEventListener('click', () => ipcRenderer.send('nextButtonClicked'));

  document.getElementById('play-button')
    .addEventListener('click', () => {
      const channel = data.isPlaying ? 'pauseButtonClicked' : 'playButtonClicked';
      ipcRenderer.send(channel);
    });

  document.getElementById('add-button')
    .addEventListener('click', () => {
      const addContainer = document.getElementById('add-container');
      addContainer.innerHTML = getAddTemplate();
      
      currentUriOfAddPage = data.uri;
      setAddButtonsListeners();

      hide('player-container');
      show('add-container');
      fixWindowHeight();
    });
}

function setAddButtonsListeners() {
  document.getElementById('add-back-button')
    .addEventListener('click', () => {
      hide('add-container');
      show('player-container');
      fixWindowHeight();
    });
  
  document.getElementById('add-save-button')
    .addEventListener('click', () => ipcRenderer.send('addToLibraryClicked', currentUriOfAddPage));

  document.getElementById('add-playlist-button')
    .addEventListener('click', () => {
      const playlistsContainer = document.getElementById('playlists-container');

      playlistsContainer.style.display === 'none'
        ? ipcRenderer.send('addToPlaylistButtonClicked')
        : closePlaylistsContainer();
    });
}

function openPlaylistsContainer(playlists) {
  toggleAddPlaylistIcon();
  const playlistsContainer = document.getElementById('playlists-container');
  playlistsContainer.style.display = 'block';

  playlists.forEach(playlist => playlistsContainer.innerHTML += getPlaylistTemplate(playlist));
  setPlaylistsListeners(playlists);
  fixWindowHeight();
}

function closePlaylistsContainer() {
  toggleAddPlaylistIcon();
  const playlistsContainer = document.getElementById('playlists-container');
  playlistsContainer.innerHTML = '';
  playlistsContainer.style.display = 'none';
  fixWindowHeight();
}

function setPlaylistsListeners(playlists) {
  playlists.forEach(playlist => {
    const playlistContainer = document.getElementById(`playlist-${playlist.id}`);
    playlistContainer.addEventListener('click', () => {
      const data = {
        playlistId: playlist.id,
        uri: currentUriOfAddPage
      };
      ipcRenderer.send('playlistSelected', data);
    });
  });
}

function toggleAddPlaylistIcon() {
  const playlistsContainer = document.getElementById('playlists-container');
  const addPlaylistIcon = document.getElementById('add-playlist-icon');
  
  if(playlistsContainer.style.display === 'none') {
    addPlaylistIcon.classList.remove('fa-chevron-right');
    addPlaylistIcon.classList.add('fa-chevron-down');
  } else {
    addPlaylistIcon.classList.remove('fa-chevron-down');
    addPlaylistIcon.classList.add('fa-chevron-right');
  }
}

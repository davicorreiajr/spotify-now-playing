'use strict'
const { ipcRenderer } = require('electron');

// ipcRenderer.on('currentPlayback', (event, message) => setPlayer(message));
// ipcRenderer.on('loading', () => setLoader());

setPlayer({
  albumImageSrc: "https://i.scdn.co/image/d55378fca9aac41a881553bd5cf1d1958c2e4f28",
  albumName: "Dire Straits",
  artistName: "Dire Straits",
  musicName: "Sultans Of Swing",
  musicDuration: 232106,
  currentProgress: 177056,
  isPlaying: true
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
    <div class="add-option-container spacement-bottom-xl">
      <i class="fas fa-chevron-left control-icon text-color-secondary"></i>
      <p class="spacement-left-lg text-color-secondary">Back</p>
    </div>
    <p class="add-option-container spacement-bottom-md">Save to Your Library</p>
    <div class="add-option-container">
      <i class="fas fa-chevron-right control-icon"></i>
      <p class="spacement-left-lg">Add to Playlist</p>
    </div>
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

function setPlayer(data) {
  hide('loader');
  show('player-container');

  const playerContainer = document.getElementById('player-container');
  playerContainer.innerHTML = getPlayerTemplate(data);
  setProgressBar(data.currentProgress, data.musicDuration);
  setButtonsListeners(data.isPlaying);
  fixWindowHeight();
}

function setLoader() {
  hide('player-container');
  show('loader');
  fixWindowHeight();
}

function fixWindowHeight() {
  const height = document.body.scrollHeight;
  ipcRenderer.send('fixHeight', height);
}

function setProgressBar(currentProgress, musicDuration) {
  const progressBar = document.getElementById('progress-bar');
  const progress = (currentProgress / musicDuration) * 100
  progressBar.style.width = `${progress}%`;
}

function setButtonsListeners(isPlaying) {
  document.getElementById('previous-button')
    .addEventListener('click', () => ipcRenderer.send('previousButtonClicked'));

  document.getElementById('next-button')
    .addEventListener('click', () => ipcRenderer.send('nextButtonClicked'));

  document.getElementById('play-button')
    .addEventListener('click', () => {
      const channel = isPlaying ? 'pauseButtonClicked' : 'playButtonClicked';
      ipcRenderer.send(channel);
    });

  document.getElementById('add-button')
    .addEventListener('click', () => {
      const addContainer = document.getElementById('add-container');
      addContainer.innerHTML = getAddTemplate();

      hide('player-container');
      show('add-container');
      fixWindowHeight();
    });
}


'use strict'
const { ipcRenderer } = require('electron');

ipcRenderer.on('currentPlayback', (event, message) => setPlayer(message));
ipcRenderer.on('loading', () => setLoader());

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
    </div
  `;
}

function showLoader() {
  const loaderContainer = document.getElementById('loader');
  loaderContainer.style.display = 'block';
}

function hideLoader() {
  const loaderContainer = document.getElementById('loader');
  loaderContainer.style.display = 'none';
}

function showPlayer() {
  const playerContainer = document.getElementById('player-container');
  playerContainer.style.display = 'block';
}

function hidePlayer() {
  const playerContainer = document.getElementById('player-container');
  playerContainer.style.display = 'none';
}

function setPlayer(data) {
  hideLoader();
  showPlayer();

  const playerContainer = document.getElementById('player-container');
  playerContainer.innerHTML = getPlayerTemplate(data);
  setProgressBar(data.currentProgress, data.musicDuration);
  setButtonsListeners(data.isPlaying);
  fixWindowHeight();
}

function setLoader() {
  hidePlayer();
  showLoader();
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
}


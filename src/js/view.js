'use strict'
const { ipcRenderer } = require('electron');

ipcRenderer.on('currentPlayback', (event, message) => setPlayer(message));

function getPlayerTemplate(data) {
  return `
    <div class="spacement-bottom-md">
      <img src="${data.albumImageSrc}" class="album-cover">
    </div>
    <p class="spacement-bottom-sm music-name">${data.musicName}</p>
    <p class="spacement-bottom-sm album-name">${data.albumName}</p>
    <p class="spacement-bottom-sm">${data.artistName}</p>
  `;
}

function setPlayer(data) {
  const playerContainer = document.getElementById('js-player-container');
  playerContainer.innerHTML = getPlayerTemplate(data);
}

'use strict'

const { ipcRenderer } = require('electron');

ipcRenderer.on('currentPlayback', (event, message) => setPlayer(message));

function getPlayerTemplate(data) {
  return `
    <div>
      <img src="${data.albumImageSrc}">
    </div>
    <div>${data.musicName}</div>
    <div>${data.albumName}</div>
    <div>${data.artistName}</div>
  `;
}

function setPlayer(data) {
  const playerContainer = document.getElementById('js-player-container');
  playerContainer.innerHTML = getPlayerTemplate(data);
}
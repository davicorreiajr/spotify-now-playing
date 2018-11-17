'use strict'

const { ipcRenderer } = require('electron');

ipcRenderer.on('currentPlayback', (event, message) => setPlayer(message));

function getPlayerTemplate(data) {
  return `
    <div>
      <img src="${data.item.album.images[0].url}">
    </div>
    <div>${data.item.name}</div>
    <div>${data.item.artists[0].name}</div>
  `;
}

function setPlayer(data) {
  const playerContainer = document.getElementById('js-player-container');
  playerContainer.innerHTML = getPlayerTemplate(data);
}
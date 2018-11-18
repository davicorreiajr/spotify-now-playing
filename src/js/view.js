'use strict'
const { ipcRenderer } = require('electron');

ipcRenderer.on('currentPlayback', (event, message) => setPlayer(message));
// setPlayer({
//   albumImageSrc: "https://i.scdn.co/image/b0a52a657cd3530f717adaff61112ff15ec76205",
//   albumName: 'We Like it Here',
//   artistName: 'Snarky Puppy',
//   musicName: 'Lingus'
// });

// setTimeout(function() {
//   setPlayer({
//     albumImageSrc: "https://i.scdn.co/image/b0a52a657cd3530f717adaff61112ff15ec76205",
//     albumName: 'We Like it Here',
//     artistName: 'Snarky Puppy Snarky Puppy Snarky Puppy Snarky Puppy',
//     musicName: 'Lingus Lingus Lingus Lingus Lingus Lingus Lingus Lingus'
//   });
// }, 3000);

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
  fixWindowHeight()
}

function fixWindowHeight() {
  const height = document.body.scrollHeight;
  ipcRenderer.send('fixHeight', height);
}

window.onload = fixWindowHeight;

'use strict'
const { ipcRenderer } = require('electron');

ipcRenderer.on('currentPlayback', (event, message) => setPlayer(message));
ipcRenderer.on('loading', (event, message) => setLoader());
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

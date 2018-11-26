'use strict';
const ipcRenderer = require('electron').ipcRenderer;

document.getElementById('download-update-link')
  .addEventListener('click', () => ipcRenderer.send('downloadUpdateButtonClicked'));

document.getElementById('cancel-update-link')
  .addEventListener('click', () => ipcRenderer.send('cancelUpdateButtonClicked'));

ipcRenderer.on('downloadStarted', () => {
  const updateInformationContainer = document.getElementById('update-information-container');
  const updatingContainer = document.getElementById('updating-container');

  updateInformationContainer.style.display = 'none';
  updatingContainer.style.display = 'block';
});

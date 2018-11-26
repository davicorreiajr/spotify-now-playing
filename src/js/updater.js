'use strict';
const { app, BrowserWindow, ipcMain } = require('electron');
const githubDatasource = require('./github-datasource');

let updateWindow;

function createWindow(window) {
  return new BrowserWindow(
    {
      parent: window,
      width: 500,
      height: 250,
      modal: true,
      show: true,
      alwaysOnTop: true,
      webPreferences: {
        devTools: true // REMOVE
      }
    }
  );
}

function isAppUpdated(versionFromGithub) {
  const localAppVersion = app.getVersion();
  return localAppVersion === versionFromGithub;
}

function showUpdateWindow(parentWindow) {
  updateWindow = createWindow(parentWindow);
  updateWindow.loadFile('src/html/update.html');
}

function setListenersToUpdateWindow(dmgDownloadUrl) {
  ipcMain.on('downloadUpdateButtonClicked', () => updateWindow.webContents.downloadURL(dmgDownloadUrl));
  ipcMain.on('cancelUpdateButtonClicked', () => updateWindow.destroy());
  updateWindow.webContents.session.on('will-download', (event, item) => {
    item.on('updated', () => updateWindow.webContents.send('downloadStarted'));
    item.once('done', () => updateWindow.destroy());
  });
  
}

exports.execute = function(parentWindow) {
  githubDatasource.getLatestVersion()
    .then(data => {
      if(!isAppUpdated(data.version)) {
        showUpdateWindow(parentWindow);
        setListenersToUpdateWindow(data.dmgDownloadUrl);
      }
    });
};

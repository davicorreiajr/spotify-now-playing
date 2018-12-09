'use strict';
const { app, ipcMain } = require('electron');
const githubDatasource = require('../data-source/github-datasource');
const windowFactory = require('../helpers/window-factory');

let updateWindow;
let dmgDownloadUrl;

ipcMain.on('downloadUpdateButtonClicked', () => updateWindow.webContents.downloadURL(dmgDownloadUrl));
ipcMain.on('cancelUpdateButtonClicked', () => updateWindow.close());

function isAppUpdated(versionFromGithub) {
  const localAppVersion = app.getVersion();
  return localAppVersion === versionFromGithub;
}

function createUpdateWindow(parentWindow) {
  updateWindow = windowFactory.get('updater', { parentWindow });
  updateWindow.loadFile('src/presentation/html/update.html');
}

function setListenersToUpdateWindow() {
  updateWindow.on('closed', () => updateWindow = null);
  updateWindow.webContents.session.on('will-download', (event, item) => {
    item.setSavePath(`${app.getPath('downloads')}/${item.getFilename()}`);
    item.on('updated', () => updateWindow.webContents.send('downloadStarted'));
    item.once('done', () => {
      if(updateWindow) updateWindow.destroy();
    });
  });
}

exports.execute = function(parentWindow) {
  githubDatasource.getLatestVersion()
    .then(data => {
      if(!isAppUpdated(data.version)) {
        dmgDownloadUrl = data.dmgDownloadUrl;

        if(!updateWindow) {
          createUpdateWindow(parentWindow);
          setListenersToUpdateWindow();
        }
      }
    });
};

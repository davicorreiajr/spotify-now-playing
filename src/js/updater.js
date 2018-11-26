'use strict';
const { app, BrowserWindow } = require('electron');
const githubDatasource = require('./github-datasource');

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
  const updateWindow = createWindow(parentWindow);
  updateWindow.loadFile('src/html/update.html');
}

exports.execute = function(parentWindow) {
  githubDatasource.getLatestVersion()
    .then(data => {
      if(!isAppUpdated(data.version)) showUpdateWindow(parentWindow);
    });
};

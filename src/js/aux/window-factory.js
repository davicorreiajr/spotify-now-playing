'use strict';
const { BrowserWindow } = require('electron');

function getMainPlayer(parentWindow) {
  return new BrowserWindow(
    {
      parent: parentWindow,
      modal: true,
      show: false,
      alwaysOnTop: true,
      webPreferences: {
        nodeIntegration: false
      }
    }
  );
}

exports.get = function(type, parentWindow) {
  const windows = {
    'main-player': getMainPlayer
  };

  return windows[type](parentWindow);
};

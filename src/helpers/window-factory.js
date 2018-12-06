'use strict';
const { BrowserWindow } = require('electron');

function getAuth(parentWindow) {
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
    'auth': getAuth
  };

  return windows[type](parentWindow);
};

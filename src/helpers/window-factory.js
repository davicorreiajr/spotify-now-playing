'use strict';
const { BrowserWindow } = require('electron');
const { APP_NAME, MAIN_WINDOW_WIDTH, MAIN_WINDOW_HEIGHT, UPDATER_WINDOW_HEIGHT, UPDATER_WINDOW_WIDTH } = require('./constants');

function getAuth(options) {
  return new BrowserWindow(
    {
      parent: options.parentWindow,
      modal: true,
      show: false,
      webPreferences: {
        nodeIntegration: false
      }
    }
  );
}

function getMain() {
  return new BrowserWindow({
    width: MAIN_WINDOW_WIDTH,
    height: MAIN_WINDOW_HEIGHT,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    closable: false,
    alwaysOnTop: true,
    fullscreenable: false,
    title: APP_NAME,
    show: false,
    frame: false
  });
}

function getUpdater(options) {
  return new BrowserWindow(
    {
      parent: options.parentWindow,
      width: UPDATER_WINDOW_WIDTH,
      height: UPDATER_WINDOW_HEIGHT,
      modal: true,
      show: false
    }
  );
}

exports.get = function(type, options) {
  const windows = {
    'auth': getAuth,
    'main': getMain,
    'updater': getUpdater
  };

  return windows[type](options);
};

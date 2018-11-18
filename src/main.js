'use strict'
const path = require('path');
const { app, BrowserWindow, Tray, Menu, ipcMain } = require('electron');
const spotify = require('./js/spotify-player');

const APP_NAME = 'Spotify - now playing';
const WINDOW_WIDTH = 250;
const WINDOW_HEIGHT = 400;

let window;
let tray;

function launchApp() {
  tray = createTray();
  setTrayConfigs(tray);
  setTrayListeners(tray);

  window = createBrowserWindow(tray);
  setWindowConfigs(window);

  window.loadFile('src/index.html');
  window.webContents.send('loading', {});
  window.webContents.openDevTools(); // REMOVE
  setWindowListeners(window);

  spotify.execute(window);
}

function createTray() {
  return new Tray(path.join(__dirname, 'img/iconTemplate.png'));
}

function setTrayConfigs(tray) {
  tray.setHighlightMode('never');
  tray.setIgnoreDoubleClickEvents(true);
}

function setTrayListeners(tray) {
  tray.on('right-click', () => manageTrayRightClick(tray));
  tray.on('click', () => window.isVisible() ? window.hide() : window.show());
}

function createBrowserWindow(tray) {
  const bounds = tray.getBounds();
  const width = WINDOW_WIDTH;
  const height = WINDOW_HEIGHT;

  let browserWindowOptions = {
    width,
    height,
    x: bounds.x - width/2,
    y: bounds.y,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    closable: false,
    alwaysOnTop: true,
    fullscreenable: false,
    title: APP_NAME,
    show: true, // CHANGE TO FALSE
    frame: false
  };
  
  return new BrowserWindow(browserWindowOptions);
}

function setWindowConfigs(window) {
  window.setVisibleOnAllWorkspaces(true);
  // window.setAlwaysOnTop(true, 'floating');
}

function setWindowListeners(window) {
  window.on('closed', () => window = null);
  // window.on('blur', () => window.hide()); // UNCOMMENT
}

function manageTrayRightClick(tray) {
  window.hide();

  const trayMenuTemplate = [
    {
      label: APP_NAME,
      enabled: false
    },
    {
      label: 'Quit',
      click: function() {
        window.setClosable(true);
        app.quit();
      }
    }
  ];
  const trayMenu = Menu.buildFromTemplate(trayMenuTemplate);

  tray.popUpContextMenu(trayMenu);
}

ipcMain.on('fixHeight', (event, height) => window.setSize(WINDOW_WIDTH, height));

app.dock.hide();

app.on('ready', launchApp);

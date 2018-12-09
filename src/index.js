'use strict';
const path = require('path');
const { app, BrowserWindow, Tray, Menu, ipcMain } = require('electron');
const spotify = require('./domain/spotify-player');
const updater = require('./domain/updater');
const windowFactory = require('./helpers/window-factory');
const { APP_NAME, MAIN_WINDOW_WIDTH } = require('./helpers/constants');

let window;
let tray;

function launchApp() {
  tray = createTray();
  setTrayConfigs(tray);
  setTrayListeners(tray);

  window = windowFactory.get('main');
  setWindowConfigs(window);
  setApplicationMenuToEnableCopyPaste();

  window.loadFile(path.join(__dirname, 'presentation/html/index.html'));
  window.webContents.send('loading', {});
  setWindowListeners(window);

  spotify.execute(window);
  setInterval(() => updater.execute(window), 86400000);
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
  tray.on('click', (event, bounds) => {
    const windowWidth = window.getSize()[0];
    const trayWidth = bounds.width;
    const x = bounds.x - windowWidth/2 + trayWidth/2;
    const y = bounds.y;
    window.setPosition(x, y);
    window.isVisible() ? hideAllWindows() : showAllWindows();
  });
}

function hideAllWindows() {
  BrowserWindow.getAllWindows().forEach(window => window.hide());
}

function showAllWindows() {
  BrowserWindow.getAllWindows().forEach(win => {
    win.show();
    if(win.id !== window.id) win.center();
  });
}

function setWindowConfigs(window) {
  window.setVisibleOnAllWorkspaces(true);
}

function setApplicationMenuToEnableCopyPaste() {
  const template = [
    {
      label: 'Edit',
      submenu: [
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:' },
        { label: 'Select All', accelerator: 'CmdOrCtrl+A', selector: 'selectAll:' }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function setWindowListeners(window) {
  window.on('closed', () => window = null);
  window.on('blur', () => window.hide());
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

ipcMain.on('fixHeight', (event, height) => window.setSize(MAIN_WINDOW_WIDTH, height));

if(app.dock) app.dock.hide();

app.on('ready', launchApp);

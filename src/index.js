'use strict';
require('./sentry');
const path = require('path');
const fs = require('fs');
const { app, BrowserWindow, Tray, Menu, ipcMain, shell } = require('electron');
const spotify = require('./domain/spotify-player');
const updater = require('./domain/updater');
const windowFactory = require('./helpers/window-factory');
const { APP_NAME, MAIN_WINDOW_WIDTH, FEEDBACK_LINK } = require('./helpers/constants');

let window;
let tray;

function launchApp() {
  tray = new Tray(path.join(__dirname, 'img/iconTemplate.png'));
  setTrayConfigs(tray);
  setTrayListeners(tray);

  window = windowFactory.get('main');
  setWindowConfigs(window);
  setApplicationMenuToEnableCopyPaste();

  window.loadFile(path.join(__dirname, 'presentation/html/index.html'));
  window.webContents.send('loading', {});
  setWindowListeners(window);

  spotify.execute(window);
  updater.execute(window);
  setInterval(() => updater.execute(window), 86400000);
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

function getNotificationSettings(){ 
  let rawdata = fs.readFileSync('./.notification-prefs.json');
  let notificationSettings = JSON.parse(rawdata).activateNotifications;
  
  return notificationSettings;
}

function setNotificationSettings(currentNotificationSettings){
   var jsonContent = '{"activateNotifications":'+ !currentNotificationSettings +'}';
   fs.writeFile('./.notification-prefs.json', jsonContent, function (err) { if (err) throw err; });
}

function manageTrayRightClick(tray) {
  const openAtLogin = app.getLoginItemSettings().openAtLogin; 
  const activateNotifications = getNotificationSettings(); 
  window.hide();

  const trayMenuTemplate = [
    {
      label: APP_NAME,
      enabled: false
    },
    {
      label: 'Open at Login',
      type: 'checkbox',
      checked: openAtLogin,
      click: () => app.setLoginItemSettings({ openAtLogin: !openAtLogin })
    },
    {
      label: 'Give feedback!',
      click: () => shell.openExternal(FEEDBACK_LINK)
    },
    {
      type: 'separator'
    },
    {
      label: 'Activate Notifications',  
      type: 'checkbox',
      checked: activateNotifications,
      click: () => setNotificationSettings(activateNotifications) 
    },
    {
      type: 'separator'
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

ipcMain.on('fixHeight', (event, height) => window.setSize(MAIN_WINDOW_WIDTH, height, true));

if(app.dock) app.dock.hide();

app.on('ready', launchApp);

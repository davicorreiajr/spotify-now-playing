const path = require('path');
const { app, BrowserWindow, Tray, Menu } = require('electron');
  
let window;

function launchApp() {
  const tray = createTray();
  setTrayConfigs(tray);
  setTrayListeners(tray);

  window = createBrowserWindow(tray);
  window.loadFile('index.html');
  setWindowListeners(window);
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
  const width = 250;
  const height = 300;

  let browserWindowOptions = {
    title: 'Spotify preview',
    frame: false,
    resizable: false,
    movable: false,
    closable: false,
    alwaysOnTop: true,
    minimizable: false,
    maximizable: false,
    fullscreen: false,
    fullscreenable: false,
    show: false,
    width,
    height,
    x: bounds.x - width/2,
    y: bounds.y
  };
  
  return new BrowserWindow(browserWindowOptions);
}

function setWindowListeners(window) {
  window.on('closed', () => window = null);
  window.on('blur', () => window.hide());
}

function manageTrayRightClick(tray) {
  window.hide();

  const trayMenuTemplate = [
    {
      label: 'Spotify preview',
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

app.dock.hide()

app.on('ready', launchApp)

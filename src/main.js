const path = require('path');
const { app, BrowserWindow, Tray, Menu, net } = require('electron');
const fetch = require('electron-fetch').default

const APP_NAME = 'Spotify - playing now';
const SPOTIFY_CLIENT_ID = '331f622d406c476091927bd984a9ec8c';
const SPOTIFY_CLIENT_SECRET = '5f4ba55bb5364d1eb8d23ce6a0ff386c';
const SPOTIFY_BASE_AUTHORIZE_URL = 'https://accounts.spotify.com/en/authorize';
const SPOTIFY_REDIRECT_URI = 'https%3A%2F%2Fexample.com%2Fcallback';
const SPOTIFY_SCOPES = 'user-read-playback-state%20user-read-private';

let window;
let authorized;

function manageSpotifyAuthorization(window) {
  const spotifyAuthWindow = new BrowserWindow(
    {
      parent: window,
      modal: true,
      show: true,
      alwaysOnTop: true,
      webPreferences: {
        nodeIntegration: false,
        devTools: true
      }
    }
  )

  const spotifyAuthUrl = `${SPOTIFY_BASE_AUTHORIZE_URL}?client_id=${SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${SPOTIFY_REDIRECT_URI}&scope=${SPOTIFY_SCOPES}`;
  spotifyAuthWindow.loadURL(spotifyAuthUrl);

  spotifyAuthWindow.once('ready-to-show', () => spotifyAuthWindow.show());
  
  let authCode;
  const webContents = spotifyAuthWindow.webContents;
  webContents.on('did-finish-load', () => {
    const url = webContents.getURL();
    const urlQueryParams = url.split('?')[1] || '';
    const urlSearchParams = new URLSearchParams(urlQueryParams);
    const code = urlSearchParams.get('code');

    if(url.split('?')[0] === 'https://example.com/callback' && code) {
      authCode = code.split('#')[0];

      const body = new URLSearchParams();
      body.append('grant_type', 'authorization_code');
      body.append('code', authCode);
      body.append('client_id', '331f622d406c476091927bd984a9ec8c');
      body.append('client_secret', '5f4ba55bb5364d1eb8d23ce6a0ff386c');
      body.append('redirect_uri', 'https://example.com/callback');

      fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        body: body.toString(),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })
        .then(res => res.json())
        .then(json => {
          console.log(json);
          authorized = true;
        });
    }
  })
}

function launchApp() {
  const tray = createTray();
  setTrayConfigs(tray);
  setTrayListeners(tray);

  window = createBrowserWindow(tray);
  window.loadFile('src/index.html');
  setWindowListeners(window);

  manageSpotifyAuthorization(window)
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
  tray.on('click', () => {
    if(authorized) {
      window.isVisible() ? window.hide() : window.show()
    }
  });
}

function createBrowserWindow(tray) {
  const bounds = tray.getBounds();
  const width = 250;
  const height = 300;

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
    show: false,
    frame: false
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

// app.dock.hide()

app.on('ready', launchApp)

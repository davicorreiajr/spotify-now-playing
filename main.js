const path = require('path');
const { app, BrowserWindow, Tray } = require('electron')
  
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

function createWindow () {
  const tray = new Tray(path.join(__dirname, 'img/iconTemplate.png'));
  tray.setHighlightMode('never');

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
    width,
    height,
    x: bounds.x - width/2,
    y: bounds.y
  };
  
  win = new BrowserWindow(browserWindowOptions);
  win.hide();

  tray.on('click', () => win.isVisible() ? win.hide() : win.show());

  win.loadFile('index.html');

  // win.webContents.openDevTools()

  // Emitted when the window is closed.
  win.on('closed', () => win = null);
  
  win.on('blur', () => win.hide());
}

app.dock.hide()

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
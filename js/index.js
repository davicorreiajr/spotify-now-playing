var path = require('path');
var { Tray, Menu } = require('electron').remote;

var trayIcon = null;

if (process.platform === 'darwin') {
    trayIcon = new Tray(path.join(__dirname, 'img/iconTemplate.png'));
}
else {
    trayIcon = new Tray(path.join(__dirname, 'img/icon.png'));
}

var trayMenuTemplate = [
    {
        label: 'Bleus',
        enabled: false
    }
];
var trayMenu = Menu.buildFromTemplate(trayMenuTemplate);
trayIcon.setContextMenu(trayMenu);
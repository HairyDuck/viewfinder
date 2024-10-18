const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');

const store = new Store();
let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        },
        backgroundColor: '#f3f3f3',
        frame: true
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));
    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });

    app.whenReady().then(() => {
        createWindow();
        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) createWindow();
        });
    });
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

const menuTemplate = [
    {
        label: 'File',
        submenu: [
            {
                label: 'Open Image',
                accelerator: 'CmdOrCtrl+O',
                click() { openImage(); }
            },
            { type: 'separator' },
            { role: 'quit' }
        ]
    },
    {
        label: 'Help',
        submenu: [
            {
                label: 'Open DevTools',
                accelerator: 'CmdOrCtrl+Shift+I',
                click() {
                    mainWindow.webContents.toggleDevTools();
                }
            },
            { role: 'reload' },

            {
                label: 'Help',
                click() { openHelpWindow(); }
            },

            {
                label: 'About',
                click() { openAboutDialog(); }
            }

        ]
    }
];

// Open Image functionality
function openImage() {
    dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp'] }]
    }).then(result => {
        if (!result.canceled && result.filePaths.length > 0) {
            const imagePath = result.filePaths[0];
            const folderPath = path.dirname(imagePath);

            fs.readdir(folderPath, (err, files) => {
                if (err) {
                    mainWindow.webContents.send('error', 'Failed to read the selected folder.');
                    return;
                }

                const extensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp'];
                const imagePaths = files.filter(file => extensions.includes(file.split('.').pop().toLowerCase()))
                                        .map(file => ({ imagePath: path.join(folderPath, file) }));

                mainWindow.webContents.send('load-image', imagePath, imagePaths);
            });
        }
    }).catch(err => {
        mainWindow.webContents.send('error', 'Failed to open image.');
    });
}



// About Dialog with Version and Credits
function openAboutDialog() {
    const version = app.getVersion();  // Get the app version

    dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'About Viewfinder',
        message: `
Viewfinder - Version ${version}
Developed by Hairy Duck
Built with Electron and Viewer.js

Credits:
- Electron: https://www.electronjs.org/ (MIT License)
- Viewer.js: https://fengyuanchen.github.io/viewerjs/ (MIT License)

Visit the official GitHub repository for Viewfinder:
https://github.com/hairy-duck/viewfinder
        `,
        buttons: ['Visit GitHub', 'OK'],
        defaultId: 1
    }).then(result => {
        if (result.response === 0) {
            shell.openExternal('https://github.com/hairy-duck/viewfinder');  // Open GitHub link
        }
    });
}

// Help Window
function openHelpWindow() {
    const helpWindow = new BrowserWindow({
        width: 800,
        height: 600,
        parent: mainWindow,
        modal: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    helpWindow.loadFile(path.join(__dirname, 'help.html'));
    helpWindow.once('ready-to-show', () => {
        helpWindow.show();
    });
}

// Handle theme setting from preferences
ipcMain.handle('set-theme', (event, theme) => {
    store.set('theme', theme);
    mainWindow.webContents.send('set-theme', theme);
});

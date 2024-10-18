
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    loadImage: (callback) => ipcRenderer.on('load-image', (event, filePath, thumbnailPath) => callback(filePath, thumbnailPath)),
    loadFolder: (callback) => ipcRenderer.on('load-folder', (event, imageData) => callback(imageData)),
    getPreferences: () => ipcRenderer.invoke('get-preferences'),
    setPreferences: (preferences) => ipcRenderer.invoke('set-preferences', preferences),
    onError: (callback) => ipcRenderer.on('error', (event, errorMessage) => callback(errorMessage)),
    openImage: () => ipcRenderer.send('menu-open-image'),
    openFolder: () => ipcRenderer.send('menu-open-folder')
});

const { contextBridge, ipcRenderer } = require('electron')

// Expose safe Electron APIs to the web app
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getVersion:  ()       => ipcRenderer.invoke('get-app-version'),
  getPlatform: ()       => ipcRenderer.invoke('get-platform'),

  // External links
  openExternal: (url)   => ipcRenderer.invoke('open-external', url),

  // File system (for desktop file operations)
  showSaveDialog: (opts) => ipcRenderer.invoke('show-save-dialog', opts),
  showOpenDialog: (opts) => ipcRenderer.invoke('show-open-dialog', opts),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', { filePath, content }),
  readFile:  (filePath)          => ipcRenderer.invoke('read-file', { filePath }),

  // Theme
  setTheme: (theme) => ipcRenderer.invoke('set-theme', theme),

  // Check if running as Electron
  isElectron: true,
})

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Project management
  createProject: (projectData) => ipcRenderer.invoke('create-project', projectData),
  openProject: () => ipcRenderer.invoke('open-project'),
  
  // File operations
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
  openFile: (options) => ipcRenderer.invoke('open-file', options),
  
  // Menu actions
  onMenuAction: (callback) => ipcRenderer.on('menu-action', (event, action) => callback(action)),
  
  // Window controls
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),
  
  // System info
  getSystemInfo: () => ipcRenderer.invoke('get-system-info')
});
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File System API
  fs: {
    readFile: (filePath) => ipcRenderer.invoke('fs:read-file', filePath),
    writeFile: (filePath, content) => ipcRenderer.invoke('fs:write-file', filePath, content),
    deleteFile: (filePath) => ipcRenderer.invoke('fs:delete-file', filePath),
    readDir: (dirPath) => ipcRenderer.invoke('fs:read-dir', dirPath),
    createDir: (dirPath) => ipcRenderer.invoke('fs:create-dir', dirPath),
    exists: (path) => ipcRenderer.invoke('fs:exists', path),
    selectDirectory: () => ipcRenderer.invoke('fs:select-directory'),
    getProjectsDirectory: () => ipcRenderer.invoke('fs:get-projects-directory')
  },
  
  // Legacy project management (keep for compatibility)
  createProject: (projectData) => ipcRenderer.invoke('create-project', projectData),
  openProject: () => ipcRenderer.invoke('open-project'),
  
  // Legacy file operations (keep for compatibility)
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
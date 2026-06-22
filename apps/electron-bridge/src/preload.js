const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('bridge', {
  onStatus: (callback) => {
    ipcRenderer.on('bridge:status', (_event, payload) => callback(payload))
  },
  onError: (callback) => {
    ipcRenderer.on('bridge:error', (_event, message) => callback(message))
  },
  retry: () => ipcRenderer.invoke('bridge:retry')
})

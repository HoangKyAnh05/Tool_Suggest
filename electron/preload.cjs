const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getRemoteInfo: () => ipcRenderer.invoke('get-remote-info'),
  toggleFloatingHud: () => ipcRenderer.invoke('toggle-floating-hud'),
  setAlwaysOnTop: (flag) => ipcRenderer.invoke('set-always-on-top', flag),
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  onFloatingHudClosed: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('floating-hud-closed', handler);
    return () => ipcRenderer.removeListener('floating-hud-closed', handler);
  }
});

const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const net = require('net');
const QRCode = require('qrcode');
const { startRemoteHub, getLocalIpAddress } = require('../server/remote-hub.cjs');

// Prevent any uncaught exceptions from popping up Windows error dialogs
process.on('uncaughtException', (err) => {
  console.log('[Main Process Exception Handled]:', err.message);
});

let mainWindow = null;
let floatingHudWindow = null;
let hubInstance = null;

const REMOTE_PORT = 49200;

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once('error', () => resolve(false))
      .once('listening', () => {
        tester.once('close', () => resolve(true)).close();
      })
      .listen(port, '0.0.0.0');
  });
}

function createMainWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  mainWindow = new BrowserWindow({
    width: Math.min(1380, width - 40),
    height: Math.min(880, height - 40),
    minWidth: 1000,
    minHeight: 650,
    backgroundColor: '#090d16',
    title: 'StreamCue Studio Pro — Kịch Bản & OBS Director',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    frame: true,
    icon: path.join(__dirname, '../app-icon.ico'),
    show: false
  });

  // Load production build if available, otherwise fallback to devUrl
  const fs = require('fs');
  const distPath = path.join(__dirname, '../dist/index.html');

  if (fs.existsSync(distPath)) {
    mainWindow.loadFile(distPath);
  } else {
    mainWindow.loadURL('http://localhost:5173').catch(() => {
      mainWindow.loadURL('http://localhost:5176');
    });
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (floatingHudWindow) {
      floatingHudWindow.close();
      floatingHudWindow = null;
    }
  });
}

function createFloatingHudWindow() {
  if (floatingHudWindow) {
    floatingHudWindow.focus();
    return;
  }

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width } = primaryDisplay.workAreaSize;

  floatingHudWindow = new BrowserWindow({
    width: 650,
    height: 180,
    x: Math.round((width - 650) / 2),
    y: 20, // Positioned near top bezel / webcam
    alwaysOnTop: true,
    transparent: true,
    frame: false,
    hasShadow: false,
    resizable: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  const isDev = !app.isPackaged;
  const url = isDev ? 'http://localhost:5173#hud' : `file://${path.join(__dirname, '../dist/index.html#hud')}`;
  floatingHudWindow.loadURL(url);

  floatingHudWindow.on('closed', () => {
    floatingHudWindow = null;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('floating-hud-closed');
    }
  });
}

app.whenReady().then(async () => {
  // Check if port is already running from an existing instance
  const portFree = await isPortAvailable(REMOTE_PORT);
  if (portFree) {
    try {
      hubInstance = startRemoteHub(REMOTE_PORT);
    } catch (err) {
      console.log('[Main] Failed to start Remote Hub:', err.message);
    }
  } else {
    console.log('[Main] Remote Hub already running on port', REMOTE_PORT);
  }

  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC HANDLERS
ipcMain.handle('get-remote-info', async () => {
  const ip = getLocalIpAddress();
  const mobileUrl = `http://${ip}:${REMOTE_PORT}/remote`;
  let qrCodeDataUrl = '';
  try {
    qrCodeDataUrl = await QRCode.toDataURL(mobileUrl, {
      margin: 1,
      width: 260,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });
  } catch (e) {
    console.error('[Main] Error generating QR code:', e);
  }

  return {
    ip,
    port: REMOTE_PORT,
    mobileUrl,
    qrCode: qrCodeDataUrl
  };
});

ipcMain.handle('toggle-floating-hud', () => {
  if (floatingHudWindow) {
    floatingHudWindow.close();
    floatingHudWindow = null;
    return false;
  } else {
    createFloatingHudWindow();
    return true;
  }
});

ipcMain.handle('set-always-on-top', (_event, flag) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setAlwaysOnTop(flag);
    return true;
  }
  return false;
});

ipcMain.handle('minimize-window', () => {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.minimize();
});

ipcMain.handle('maximize-window', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('close-window', () => {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.close();
});

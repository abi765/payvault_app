const { app, BrowserWindow } = require('electron');
const path = require('path');
const { fork } = require('child_process');

let mainWindow;
let backendProcess;

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Someone tried to run a second instance, focus our window
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// Start backend server
function startBackend() {
  console.log('Starting backend server...');

  const backendPath = app.isPackaged
    ? path.join(process.resourcesPath, 'backend', 'src', 'server.js')
    : path.join(__dirname, 'backend', 'src', 'server.js');

  console.log('Backend path:', backendPath);

  backendProcess = fork(backendPath, [], {
    env: { ...process.env, PORT: '5001', NODE_ENV: 'production' },
    stdio: ['ignore', 'pipe', 'pipe', 'ipc']
  });

  backendProcess.stdout.on('data', (data) => {
    console.log(`Backend: ${data}`);
  });

  backendProcess.stderr.on('data', (data) => {
    console.error(`Backend Error: ${data}`);
  });

  backendProcess.on('error', (error) => {
    console.error('Failed to start backend:', error);
  });

  backendProcess.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    title: 'PayVault - Employee Salary Management'
  });

  // Load the frontend
  const frontendPath = app.isPackaged
    ? path.join(process.resourcesPath, 'app.asar', 'frontend', 'dist', 'index.html')
    : path.join(__dirname, 'frontend', 'dist', 'index.html');

  console.log('Frontend path:', frontendPath);
  console.log('Is packaged:', app.isPackaged);

  // In production, load from dist folder
  if (app.isPackaged) {
    mainWindow.loadFile(frontendPath).catch(err => {
      console.error('Failed to load frontend:', err);
      // Try alternative path
      const altPath = path.join(__dirname, 'frontend', 'dist', 'index.html');
      console.log('Trying alternative path:', altPath);
      mainWindow.loadFile(altPath);
    });
  } else {
    // In development, load from localhost
    mainWindow.loadURL('http://localhost:3000');
  }

  // Open DevTools to debug issues
  mainWindow.webContents.openDevTools();

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Start backend server
  startBackend();

  // Wait a bit for backend to start, then create window
  setTimeout(() => {
    createWindow();
  }, 2000);

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  // Kill backend process
  if (backendProcess) {
    backendProcess.kill();
  }

  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  // Kill backend process
  if (backendProcess) {
    backendProcess.kill();
  }
});

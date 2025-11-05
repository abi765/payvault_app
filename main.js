const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;

// Start backend server
function startBackend() {
  console.log('Starting backend server...');

  const backendPath = path.join(__dirname, 'backend', 'src', 'server.js');

  // Use Electron's built-in Node.js executable
  const nodePath = process.execPath;

  backendProcess = spawn(nodePath, [backendPath], {
    env: { ...process.env, PORT: '5001', NODE_ENV: 'production' },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  backendProcess.stdout.on('data', (data) => {
    console.log(`Backend: ${data}`);
  });

  backendProcess.stderr.on('data', (data) => {
    console.error(`Backend Error: ${data}`);
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
  const frontendPath = path.join(__dirname, 'frontend', 'dist', 'index.html');

  // In production, load from dist folder
  if (app.isPackaged) {
    mainWindow.loadFile(frontendPath);
  } else {
    // In development, load from localhost
    mainWindow.loadURL('http://localhost:3000');
  }

  // Open DevTools in development
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

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

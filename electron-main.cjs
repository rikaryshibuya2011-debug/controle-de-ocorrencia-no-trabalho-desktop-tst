const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const net = require('net');

let mainWindow = null;
let serverProcess = null;
const SERVER_PORT = 3000;

function waitForServer(port, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tryConnect = () => {
      const socket = new net.Socket();
      socket.setTimeout(1000);
      socket.once('connect', () => {
        socket.destroy();
        resolve();
      });
      socket.once('timeout', () => socket.destroy());
      socket.once('error', () => {
        if (Date.now() - start > timeout) {
          reject(new Error('Server startup timeout'));
        } else {
          setTimeout(tryConnect, 200);
        }
      });
      socket.connect(port, '127.0.0.1');
    };
    tryConnect();
  });
}

function startEmbeddedServer() {
  const isDev = !app.isPackaged;
  
  if (!isDev) {
    const serverPath = path.join(__dirname, 'dist', 'server.cjs');
    serverProcess = spawn(process.execPath, [serverPath], {
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1', PORT: String(SERVER_PORT), NODE_ENV: 'production' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    serverProcess.stdout?.on('data', (data) => {
      console.log('[Server]', data.toString().trim());
    });
    serverProcess.stderr?.on('data', (data) => {
      console.error('[Server Error]', data.toString().trim());
    });

    serverProcess.on('error', (err) => {
      console.error('Falha ao iniciar o servidor interno:', err);
    });
    
    serverProcess.on('exit', (code) => {
      console.log(`Server process exited with code ${code}`);
    });
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'SST Gestão',
    backgroundColor: '#0f172a',
    autoHideMenuBar: true,
    frame: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    show: false,
  });

  const isDev = !app.isPackaged;
  
  const loadApp = async () => {
    if (isDev) {
      await mainWindow.loadURL('http://localhost:5173');
    } else {
      startEmbeddedServer();
      try {
        await waitForServer(SERVER_PORT);
        await mainWindow.loadURL(`http://localhost:${SERVER_PORT}`);
      } catch (err) {
        console.error('Failed to load app:', err);
        await mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
      }
    }
    mainWindow.show();
  };

  loadApp();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

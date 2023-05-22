const { app, BrowserWindow } = require('electron');
const { v4: uuidv4 } = require('uuid');
const screenshot = require('screenshot-desktop');
const io = require('socket.io-client');

let socket;

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  win.loadFile('index.html');

  // Establish socket connection when the window is ready
  win.webContents.on('did-finish-load', () => {
    // Connect to the server
    socket = io('http://localhost:5000');

    // Generate a unique client ID
    const clientId = uuidv4();

    // Send the client ID to the server
    socket.emit('join-message', clientId);

    // Capture and send screenshots every 100 milliseconds
    setInterval(() => {
      screenshot().then((img) => {
        const imgStr = Buffer.from(img).toString('base64');

        const obj = {
          room: clientId,
          image: imgStr,
        };
    
        // Send the screenshot data to the server
        socket.emit('screen-data', JSON.stringify(obj));
      });
    }, 100);

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Disconnected from the server');
    });
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

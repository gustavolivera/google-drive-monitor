const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 400,
    height: 300,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"), // opcional, para usar ipcRenderer
      nodeIntegration: false,
      contextIsolation: true,
    },
    resizable: false,
  });

  win.loadURL("http://localhost:5173"); // endereço do vite dev server
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

import path from "path";
import { fileURLToPath } from "url";
import { app, BrowserWindow, screen } from "electron";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let win;

const expandedSize = { width: 400, height: 500 };

function createWindow() {
  win = new BrowserWindow({
    width: expandedSize.width,
    height: expandedSize.height,
    frame: true,
    transparent: false,
    alwaysOnTop: false,
    roundedCorners: true,
    hasShadow: true,
    resizable: true,
    icon: path.join(__dirname, "assets", "logo.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.setMenu(null);
  win.loadFile(path.join(__dirname, "../dist/index.html"));
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

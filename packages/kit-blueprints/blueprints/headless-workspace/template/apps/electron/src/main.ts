import { app, BrowserWindow } from "electron";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const DEV_SERVER_URL = process.env.ELECTRON_RENDERER_URL ?? "http://127.0.0.1:5173";

async function createWindow(): Promise<void> {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: join(here, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (!app.isPackaged) {
    await window.loadURL(DEV_SERVER_URL);
  } else {
    await window.loadFile(join(here, "../../web/dist/index.html"));
  }
}

app.whenReady().then(() => void createWindow());

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) void createWindow();
});

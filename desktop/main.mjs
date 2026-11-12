// Proses utama Electron: jalankan server Next.js mandiri, lalu buka jendela.
// Di mesin pengguna tidak perlu Node terpasang (server dijalankan lewat Electron).
import { spawn } from "node:child_process";
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { createServer } from "node:net";
import { join } from "node:path";
import { app, BrowserWindow, dialog, shell } from "electron";

const logFile = join(app.getPath("userData"), "desktop.log");
function log(...parts) {
  try {
    appendFileSync(logFile, `${new Date().toISOString()} ${parts.join(" ")}\n`);
  } catch {
    // logging tidak boleh menggagalkan aplikasi
  }
}

const DEV_URL = process.env.DESKTOP_DEV_URL;
const appRoot = app.isPackaged ? join(process.resourcesPath, "app") : null;
const serverEntry = appRoot ? join(appRoot, "server.js") : null;

let serverProcess = null;

function freePort() {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.unref();
    probe.on("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

// Variabel Supabase dibaca saat runtime, disimpan di app/.env (kunci publishable, bukan rahasia).
function readEnv() {
  const file = appRoot ? join(appRoot, ".env") : null;
  if (!file || !existsSync(file)) return {};
  const env = {};
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (match) env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

async function waitForServer(url, timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.status < 500) return;
    } catch {
      // server belum siap
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error("Server aplikasi tidak merespons.");
}

async function startServer() {
  if (DEV_URL) {
    log("mode dev:", DEV_URL);
    return DEV_URL;
  }
  if (!serverEntry) throw new Error("Build aplikasi tidak ditemukan. Jalankan next build dulu.");

  const port = await freePort();
  const env = { ...process.env, ...readEnv(), PORT: String(port), HOSTNAME: "127.0.0.1" };
  env.ELECTRON_RUN_AS_NODE = "1";
  log("menjalankan server:", serverEntry, "port", port);

  serverProcess = spawn(process.execPath, [serverEntry], {
    cwd: appRoot,
    env,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  serverProcess.stdout?.on("data", (chunk) => log("out:", chunk.toString().trim()));
  serverProcess.stderr?.on("data", (chunk) => log("err:", chunk.toString().trim()));
  serverProcess.on("exit", (code) => log("server keluar, kode", code));

  const url = `http://127.0.0.1:${port}`;
  await waitForServer(`${url}/login`);
  log("server siap:", url);
  return url;
}

function createWindow(url) {
  const win = new BrowserWindow({
    width: 1100,
    height: 800,
    minWidth: 360,
    minHeight: 600,
    backgroundColor: "#f6f7f8",
    title: "Catatan Uang",
    autoHideMenuBar: true,
    show: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });

  win.once("ready-to-show", () => win.show());

  // Tautan eksternal (misalnya email konfirmasi) dibuka di browser, bukan di aplikasi.
  win.webContents.setWindowOpenHandler(({ url: target }) => {
    if (!target.startsWith(url)) shell.openExternal(target);
    return { action: "deny" };
  });

  win.loadURL(url);
  return win;
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    const [win] = BrowserWindow.getAllWindows();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(async () => {
    try {
      const url = await startServer();
      createWindow(url);
    } catch (error) {
      log("gagal:", error);
      dialog.showErrorBox("Catatan Uang gagal dibuka", String(error));
      app.quit();
    }
  });

  app.on("window-all-closed", () => app.quit());
  app.on("before-quit", () => serverProcess?.kill());
}

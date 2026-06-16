const { app, BrowserWindow, Menu, ipcMain, safeStorage, shell } = require("electron");
const { fork } = require("node:child_process");
const net = require("node:net");
const http = require("node:http");
const path = require("node:path");
const fs = require("node:fs");

// Fixed ports so OAuth redirect URIs are stable (registered in Supabase + Google).
const CANDIDATE_PORTS = [38591, 38592, 38593];
const HOSTNAME = "127.0.0.1";
const isDev = process.env.ELECTRON_DEV === "1";
const DEV_URL = process.env.ELECTRON_DEV_URL || "http://localhost:3000";

let mainWindow = null;
let settingsWindow = null;
let serverChild = null;
let serverOrigin = null;

// ---------------------------------------------------------------------------
// Secret storage — Anthropic key encrypted at rest via macOS Keychain.
// ---------------------------------------------------------------------------
function secretsPath() {
  return path.join(app.getPath("userData"), "secrets.json");
}

function readSecrets() {
  try {
    const raw = fs.readFileSync(secretsPath(), "utf8");
    const stored = JSON.parse(raw);
    const out = {};
    for (const [key, value] of Object.entries(stored)) {
      if (typeof value !== "string" || !value) continue;
      out[key] = safeStorage.isEncryptionAvailable()
        ? safeStorage.decryptString(Buffer.from(value, "base64"))
        : value;
    }
    return out;
  } catch {
    return {};
  }
}

function writeSecret(key, value) {
  const current = (() => {
    try {
      return JSON.parse(fs.readFileSync(secretsPath(), "utf8"));
    } catch {
      return {};
    }
  })();
  if (value) {
    current[key] = safeStorage.isEncryptionAvailable()
      ? safeStorage.encryptString(value).toString("base64")
      : value;
  } else {
    delete current[key];
  }
  fs.writeFileSync(secretsPath(), JSON.stringify(current), { mode: 0o600 });
}

// ---------------------------------------------------------------------------
// Embedded Next.js standalone server (production builds only).
// ---------------------------------------------------------------------------
function standaloneServerPath() {
  // Packaged: bundled under Resources/standalone via electron-builder extraResources.
  // Unpackaged build run: repo .next/standalone.
  const base = app.isPackaged
    ? path.join(process.resourcesPath, "standalone")
    : path.join(__dirname, "..", ".next", "standalone");
  return { dir: base, entry: path.join(base, "server.js") };
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => server.close(() => resolve(true)));
    server.listen(port, HOSTNAME);
  });
}

async function pickPort() {
  for (const port of CANDIDATE_PORTS) {
    if (await isPortFree(port)) return port;
  }
  throw new Error(
    `None of the reserved ports (${CANDIDATE_PORTS.join(", ")}) are free.`,
  );
}

function waitForServer(origin, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const probe = () => {
      const req = http.get(origin, (res) => {
        res.resume();
        resolve();
      });
      req.on("error", () => {
        if (Date.now() > deadline) reject(new Error("Server did not start in time."));
        else setTimeout(probe, 300);
      });
    };
    probe();
  });
}

async function startServer() {
  const { dir, entry } = standaloneServerPath();
  if (!fs.existsSync(entry)) {
    throw new Error(
      `Standalone server not found at ${entry}. Run \`npm run dist:mac\` (or the build) first.`,
    );
  }

  const port = await pickPort();
  serverOrigin = `http://${HOSTNAME}:${port}`;

  const secrets = readSecrets();
  serverChild = fork(entry, [], {
    cwd: dir,
    env: {
      ...process.env,
      // Run the standalone server with Electron's bundled Node.
      ELECTRON_RUN_AS_NODE: "1",
      NODE_ENV: "production",
      PORT: String(port),
      HOSTNAME,
      // Per-user secret injected from the Keychain (never baked into the build).
      ...(secrets.ANTHROPIC_API_KEY
        ? { ANTHROPIC_API_KEY: secrets.ANTHROPIC_API_KEY }
        : {}),
    },
    stdio: ["ignore", "inherit", "inherit", "ipc"],
  });

  serverChild.on("exit", (code) => {
    serverChild = null;
    if (code && code !== 0 && !app.isQuiting) {
      console.error(`Embedded server exited with code ${code}`);
    }
  });

  await waitForServer(serverOrigin);
  return serverOrigin;
}

function stopServer() {
  if (serverChild) {
    serverChild.kill();
    serverChild = null;
  }
}

// ---------------------------------------------------------------------------
// Windows
// ---------------------------------------------------------------------------
function createMainWindow(url) {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    title: "Flowstate",
    backgroundColor: "#0b0b0f",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Open external links (e.g. OAuth consent) in the system browser, not in-app.
  mainWindow.webContents.setWindowOpenHandler(({ url: target }) => {
    shell.openExternal(target);
    return { action: "deny" };
  });

  mainWindow.loadURL(url);
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function createSettingsWindow(isFirstRun) {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }
  settingsWindow = new BrowserWindow({
    width: 520,
    height: 360,
    resizable: false,
    title: "Flowstate Settings",
    parent: mainWindow || undefined,
    modal: Boolean(mainWindow),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  settingsWindow.loadFile(path.join(__dirname, "settings.html"), {
    query: { firstRun: isFirstRun ? "1" : "0" },
  });
  settingsWindow.on("closed", () => {
    settingsWindow = null;
  });
}

// ---------------------------------------------------------------------------
// IPC for the settings window
// ---------------------------------------------------------------------------
ipcMain.handle("settings:get", () => {
  const secrets = readSecrets();
  return { hasAnthropicKey: Boolean(secrets.ANTHROPIC_API_KEY) };
});

ipcMain.handle("settings:save", async (_event, { anthropicKey }) => {
  if (typeof anthropicKey === "string") {
    writeSecret("ANTHROPIC_API_KEY", anthropicKey.trim());
  }
  // Restart the embedded server so the new key takes effect (prod only).
  if (!isDev && serverChild) {
    stopServer();
    const url = await startServer();
    if (mainWindow) mainWindow.loadURL(url);
  }
  return { ok: true };
});

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------
async function boot() {
  const hasKey = Boolean(readSecrets().ANTHROPIC_API_KEY);

  if (isDev) {
    // `concurrently` runs `next dev`; `wait-on` ensures it is up before we load.
    createMainWindow(DEV_URL);
  } else {
    const url = await startServer();
    createMainWindow(url);
  }

  if (!hasKey) createSettingsWindow(true);
}

app.whenReady().then(() => {
  buildMenu();
  boot().catch((err) => {
    console.error("Failed to start Flowstate:", err);
    app.quit();
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) boot();
  });
});

app.on("before-quit", () => {
  app.isQuiting = true;
  stopServer();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

function buildMenu() {
  const template = [
    {
      label: app.name,
      submenu: [
        { role: "about" },
        { type: "separator" },
        {
          label: "Settings…",
          accelerator: "Cmd+,",
          click: () => createSettingsWindow(false),
        },
        { type: "separator" },
        { role: "hide" },
        { role: "hideOthers" },
        { type: "separator" },
        { role: "quit" },
      ],
    },
    { role: "editMenu" },
    { role: "viewMenu" },
    { role: "windowMenu" },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

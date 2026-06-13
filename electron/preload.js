const { contextBridge, ipcRenderer } = require("electron");

// Minimal, audited surface exposed to the settings window only.
contextBridge.exposeInMainWorld("flowstate", {
  settings: {
    get: () => ipcRenderer.invoke("settings:get"),
    save: (payload) => ipcRenderer.invoke("settings:save", payload),
  },
});

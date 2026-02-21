import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  sendCaptureRegion: (rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => {
    ipcRenderer.send("capture:region-selected", rect);
  },
  cancelCapture: () => {
    ipcRenderer.send("capture:cancel");
  },
  onScreenshot: (callback: (dataUrl: string) => void) => {
    ipcRenderer.on(
      "overlay:screenshot",
      (_event: Electron.IpcRendererEvent, dataUrl: string) => {
        callback(dataUrl);
      }
    );
  },
  onClear: (callback: () => void) => {
    ipcRenderer.on("overlay:clear", () => {
      callback();
    });
  },
  readyForScreenshot: () => {
    ipcRenderer.send("overlay:ready");
  },
  screenshotReady: () => {
    ipcRenderer.send("overlay:screenshot-ready");
  },
});

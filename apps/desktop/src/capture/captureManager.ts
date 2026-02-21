import {
  BrowserWindow,
  desktopCapturer,
  ipcMain,
  nativeImage,
  screen,
} from "electron";
import { createOverlayWindow, closeOverlayWindow } from "./overlayWindow";
import { uploadCapture } from "./uploader";
import { showThumbnail } from "./thumbnailManager";

let mainWindow: BrowserWindow | null = null;
let capturedScreenshot: Electron.NativeImage | null = null;

export function initCaptureManager(win: BrowserWindow) {
  mainWindow = win;

  ipcMain.on(
    "capture:region-selected",
    async (
      _event,
      rect: { x: number; y: number; width: number; height: number }
    ) => {
      closeOverlayWindow();
      await handleRegionSelected(rect);
    }
  );

  ipcMain.on("capture:cancel", () => {
    closeOverlayWindow();
    capturedScreenshot = null;
  });

  ipcMain.on("auth:token-response", (_event, token: string | null) => {
    pendingTokenResolve?.(token);
    pendingTokenResolve = null;
  });
}

let pendingTokenResolve: ((token: string | null) => void) | null = null;

function requestAuthToken(): Promise<string | null> {
  return new Promise((resolve) => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      resolve(null);
      return;
    }
    pendingTokenResolve = resolve;
    mainWindow.webContents.send("auth:request-token");

    // Timeout after 10s
    setTimeout(() => {
      if (pendingTokenResolve) {
        pendingTokenResolve(null);
        pendingTokenResolve = null;
      }
    }, 10000);
  });
}

export async function startCapture() {
  try {
    const display = screen.getPrimaryDisplay();
    const { scaleFactor } = display;
    // Request physical pixel dimensions for Retina support
    const thumbnailSize = {
      width: Math.round(display.size.width * scaleFactor),
      height: Math.round(display.size.height * scaleFactor),
    };

    console.log("[capture] Requesting screenshot at", thumbnailSize);

    const sources = await desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize,
    });

    // Match source to primary display by display_id (like electron-screenshot-example)
    const primarySource =
      sources.find((s) => s.display_id === String(display.id)) || sources[0];
    if (!primarySource) {
      console.error("[capture] No screen source found");
      return;
    }

    capturedScreenshot = primarySource.thumbnail;
    const size = capturedScreenshot.getSize();
    console.log("[capture] Screenshot size:", size.width, "x", size.height);

    if (size.width === 0 || size.height === 0) {
      console.error(
        "[capture] Empty screenshot — check Screen Recording permission in System Settings > Privacy & Security"
      );
      return;
    }

    const screenshotDataUrl = capturedScreenshot.toDataURL();
    createOverlayWindow(screenshotDataUrl);
  } catch (err) {
    console.error("[capture] Failed to start capture:", err);
  }
}

async function handleRegionSelected(rect: {
  x: number;
  y: number;
  width: number;
  height: number;
}) {
  if (!capturedScreenshot) return;

  try {
    // Account for display scale factor (Retina)
    const scaleFactor = screen.getPrimaryDisplay().scaleFactor;
    const cropRect = {
      x: Math.round(rect.x * scaleFactor),
      y: Math.round(rect.y * scaleFactor),
      width: Math.round(rect.width * scaleFactor),
      height: Math.round(rect.height * scaleFactor),
    };

    const cropped = capturedScreenshot.crop(cropRect);
    const pngBuffer = cropped.toPNG();

    // Show thumbnail immediately
    showThumbnail(cropped.toDataURL());

    // Get auth token from renderer
    const token = await requestAuthToken();
    if (!token) {
      console.error("[capture] No auth token available");
      return;
    }

    // Upload
    const result = await uploadCapture(pngBuffer, token);
    if (result) {
      // Notify renderer to refresh library
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("capture:complete");
      }
    }
  } catch (err) {
    console.error("[capture] Region handling failed:", err);
  } finally {
    capturedScreenshot = null;
  }
}

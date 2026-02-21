import { BrowserWindow, ipcMain, screen } from "electron";
import path from "node:path";

let overlayWindow: BrowserWindow | null = null;
let pendingScreenshot: string | null = null;

function getOverlayHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #000; cursor: crosshair; }
    canvas { position: absolute; top: 0; left: 0; width: 100%; height: 100%; cursor: crosshair; }
  </style>
</head>
<body>
  <canvas id="overlay-canvas"></canvas>
  <script>
    const canvas = document.getElementById("overlay-canvas");
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    let screenshotImage = null;
    let isDrawing = false;
    let startX = 0, startY = 0, currentX = 0, currentY = 0;

    function resizeCanvas() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.scale(dpr, dpr);
      draw();
    }

    function draw() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      // Draw screenshot at full brightness — looks like the real screen
      if (screenshotImage) {
        ctx.drawImage(screenshotImage, 0, 0, w, h);
      }

      // Only draw selection UI while dragging
      if (isDrawing) {
        const x = Math.min(startX, currentX);
        const y = Math.min(startY, currentY);
        const sw = Math.abs(currentX - startX);
        const sh = Math.abs(currentY - startY);

        // Dim everything outside the selection
        ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
        ctx.fillRect(0, 0, w, y);
        ctx.fillRect(0, y + sh, w, h - y - sh);
        ctx.fillRect(0, y, x, sh);
        ctx.fillRect(x + sw, y, w - x - sw, sh);

        // Selection border
        ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, sw, sh);

        // Dimensions label below selection
        if (sw > 30 && sh > 15) {
          const label = Math.round(sw) + " x " + Math.round(sh);
          ctx.font = "11px -apple-system, BlinkMacSystemFont, sans-serif";
          const metrics = ctx.measureText(label);
          const lx = x + sw / 2 - metrics.width / 2 - 6;
          const ly = y + sh + 8;
          ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
          ctx.beginPath();
          ctx.roundRect(lx, ly, metrics.width + 12, 20, 4);
          ctx.fill();
          ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
          ctx.fillText(label, lx + 6, ly + 14);
        }
      }
    }

    window.electronAPI.onScreenshot(function(dataUrl) {
      screenshotImage = new Image();
      screenshotImage.onload = function() {
        resizeCanvas();
        // Tell main process the screenshot is rendered — safe to show window
        window.electronAPI.screenshotReady();
      };
      screenshotImage.src = dataUrl;
    });

    window.electronAPI.readyForScreenshot();

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    canvas.addEventListener("mousedown", function(e) {
      isDrawing = true;
      startX = e.clientX; startY = e.clientY;
      currentX = e.clientX; currentY = e.clientY;
    });

    canvas.addEventListener("mousemove", function(e) {
      if (!isDrawing) return;
      currentX = e.clientX; currentY = e.clientY;
      draw();
    });

    canvas.addEventListener("mouseup", function(e) {
      if (!isDrawing) return;
      isDrawing = false;
      currentX = e.clientX; currentY = e.clientY;

      const x = Math.min(startX, currentX);
      const y = Math.min(startY, currentY);
      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);

      if (width < 10 || height < 10) return;
      window.electronAPI.sendCaptureRegion({ x: x, y: y, width: width, height: height });
    });

    document.addEventListener("keydown", function(e) {
      if (e.key === "Escape") {
        window.electronAPI.cancelCapture();
      }
    });
  </script>
</body>
</html>`;
}

export function createOverlayWindow(screenshotDataUrl: string): BrowserWindow {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.close();
  }

  pendingScreenshot = screenshotDataUrl;

  const primaryDisplay = screen.getPrimaryDisplay();
  const { x, y, width, height } = primaryDisplay.bounds;

  overlayWindow = new BrowserWindow({
    x,
    y,
    width,
    height,
    show: false,
    frame: false,
    transparent: false,
    backgroundColor: "#000000",
    skipTaskbar: true,
    resizable: false,
    movable: false,
    hasShadow: false,
    focusable: true,
    fullscreenable: false,
    simpleFullscreen: true,
    webPreferences: {
      preload: path.join(__dirname, "overlay-preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const html = getOverlayHTML();
  overlayWindow.loadURL(
    `data:text/html;charset=utf-8,${encodeURIComponent(html)}`
  );

  overlayWindow.on("closed", () => {
    overlayWindow = null;
    pendingScreenshot = null;
  });

  return overlayWindow;
}

// Renderer signals it's ready — send the screenshot
ipcMain.on("overlay:ready", () => {
  if (overlayWindow && !overlayWindow.isDestroyed() && pendingScreenshot) {
    overlayWindow.webContents.send("overlay:screenshot", pendingScreenshot);
    pendingScreenshot = null;
  }
});

// Screenshot is drawn on canvas — now safe to show
ipcMain.on("overlay:screenshot-ready", () => {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.setSimpleFullScreen(true);
    overlayWindow.setAlwaysOnTop(true, "screen-saver");
    overlayWindow.show();
  }
});

export function closeOverlayWindow() {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.close();
  }
  overlayWindow = null;
  pendingScreenshot = null;
}

export function getOverlayWindow(): BrowserWindow | null {
  return overlayWindow;
}

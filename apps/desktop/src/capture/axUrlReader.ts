import path from "path";
import { app } from "electron";

interface AxUrlReaderAddon {
  readBrowserUrl(pid: number, windowTitle?: string): string | null;
}

let addon: AxUrlReaderAddon | null = null;

function getAddonPath(): string {
  if (app.isPackaged) {
    // In packaged builds, extraResource places files in the Resources dir
    return path.join(process.resourcesPath, "ax_url_reader.node");
  }
  // In development, the built addon is in native/build/Release/
  return path.join(app.getAppPath(), "native/build/Release/ax_url_reader.node");
}

function loadAddon(): AxUrlReaderAddon | null {
  if (addon) return addon;
  try {
    const addonPath = getAddonPath();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    addon = require(addonPath) as AxUrlReaderAddon;
    console.log("[axUrlReader] Loaded native addon from:", addonPath);
    return addon;
  } catch (err) {
    console.error("[axUrlReader] Failed to load native addon:", err);
    return null;
  }
}

/**
 * Read the URL bar from a Firefox-based browser using the Accessibility API
 * via a native N-API addon running in Electron's own process.
 *
 * This avoids the TCC permission issue where child processes (like Swift binaries)
 * don't inherit Electron's AX permission grant.
 */
export function readAxBrowserUrl(pid: number, windowTitle?: string): string | null {
  const mod = loadAddon();
  if (!mod) return null;
  try {
    return mod.readBrowserUrl(pid, windowTitle);
  } catch (err) {
    console.error("[axUrlReader] readBrowserUrl threw:", err);
    return null;
  }
}

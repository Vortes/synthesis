import { execFile } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

// AppleScript commands for Chromium-based and Safari browsers.
// Keys must exactly match the app name returned by CGWindowListCopyWindowInfo.
const BROWSER_SCRIPTS: Record<string, string> = {
  "Google Chrome":
    'tell application "Google Chrome" to get URL of active tab of front window',
  "Google Chrome Canary":
    'tell application "Google Chrome Canary" to get URL of active tab of front window',
  "Brave Browser":
    'tell application "Brave Browser" to get URL of active tab of front window',
  "Microsoft Edge":
    'tell application "Microsoft Edge" to get URL of active tab of front window',
  Arc: 'tell application "Arc" to get URL of active tab of front window',
  Safari: 'tell application "Safari" to get URL of front document',
  "Safari Technology Preview":
    'tell application "Safari Technology Preview" to get URL of front document',
};

// Lowercase process names for Firefox-based browsers.
// Matching is done case-insensitively against the incoming appName.
const FIREFOX_BASED_NAMES = new Set([
  "firefox",
  "zen",
  "waterfox",
  "librewolf",
]);

// AppleScript for Firefox-based browsers uses the Accessibility API to read
// the URL bar combo box.  Two fallback paths cover different UI layouts.
// NOTE: The appName embedded here comes only from FIREFOX_BASED_NAMES, never
// from raw user input, so template-literal interpolation is safe.
function buildFirefoxScript(resolvedAppName: string): string {
  // Try multiple accessibility paths since the UI hierarchy can vary between
  // Firefox forks and versions. The "Navigation" toolbar description is the
  // most reliable anchor.
  return `tell application "System Events"
    tell application process "${resolvedAppName}"
        try
            return value of combo box 1 of group 1 of (first toolbar of group 1 of window 1 whose description is "Navigation")
        on error
            try
                return value of combo box 1 of group 1 of toolbar 1 of group 1 of window 1
            on error
                return ""
            end try
        end try
    end tell
end tell`;
}

function runOsascript(script: string): Promise<string | null> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.log("[browserUrl] osascript timed out");
      resolve(null);
    }, 2000);

    // Write script to a temp file and execute it — avoids argument passing
    // issues with multi-line scripts via execFile's -e flag.
    const tmpFile = path.join(os.tmpdir(), `synthesis-osascript-${Date.now()}.scpt`);
    fs.writeFileSync(tmpFile, script, "utf-8");

    execFile("osascript", [tmpFile], (error, stdout, stderr) => {
      clearTimeout(timeout);
      try { fs.unlinkSync(tmpFile); } catch {}
      if (error) {
        console.log("[browserUrl] osascript error:", error.message);
        if (stderr) console.log("[browserUrl] osascript stderr:", stderr);
        resolve(null);
        return;
      }
      console.log("[browserUrl] osascript stdout:", JSON.stringify(stdout));
      resolve(stdout);
    });
  });
}

function validateUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("file://")
  ) {
    return trimmed;
  }
  // Some browsers (Zen, Firefox) show bare domains in the URL bar
  // without the protocol. If it looks like a domain, prepend https://.
  if (/^[a-zA-Z0-9][\w.-]+\.[a-zA-Z]{2,}(\/.*)?$/.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return null;
}

/** Returns true if the given app name is a known browser. */
export function isBrowser(appName: string): boolean {
  return (
    appName in BROWSER_SCRIPTS ||
    FIREFOX_BASED_NAMES.has(appName.toLowerCase())
  );
}

export async function getBrowserUrl(appName: string): Promise<string | null> {
  // 1. Check Chromium-based / Safari browsers via direct AppleScript.
  const chromiumScript = BROWSER_SCRIPTS[appName];
  if (chromiumScript !== undefined) {
    const raw = await runOsascript(chromiumScript);
    if (raw === null) return null;
    return validateUrl(raw);
  }

  // 2. Check Firefox-based browsers via Accessibility API AppleScript.
  //    System Events uses the actual process name which is typically lowercase
  //    (e.g. "zen"), while CGWindowList may return a capitalized display name
  //    (e.g. "Zen"). Try lowercase first, then original casing as fallback.
  if (FIREFOX_BASED_NAMES.has(appName.toLowerCase())) {
    const lowered = appName.toLowerCase();
    const script = buildFirefoxScript(lowered);
    const raw = await runOsascript(script);
    if (raw !== null) {
      const url = validateUrl(raw);
      if (url) return url;
    }
    // Fallback: try original casing in case the process name is capitalized
    if (lowered !== appName) {
      const fallbackRaw = await runOsascript(buildFirefoxScript(appName));
      if (fallbackRaw !== null) return validateUrl(fallbackRaw);
    }
    return null;
  }

  // 3. Not a known browser.
  return null;
}

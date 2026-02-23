# Window Context Capture — Technical Notes

## What We Built
When a user takes a screenshot via the Electron app, we automatically detect which app/window they captured and store `sourceApp` + `sourceUrl` alongside the capture.

## Architecture
1. **Swift binary** (`apps/desktop/swift-helpers/window-info.swift`) — window matching only
   - Uses `CGWindowListCopyWindowInfo` to find the frontmost window overlapping the selection
   - Returns JSON: `{ appName, bundleId, windowTitle, pid }`
   - No AX code — purely a window-matching tool
2. **Native N-API addon** (`apps/desktop/native/src/ax_url_reader.mm`) — Firefox/Zen URL reading
   - Compiled Objective-C++ addon that runs **in Electron's own process** (same PID)
   - Reads URL bar via macOS Accessibility API (AXUIElement)
   - AX tree path: `window → AXGroup → AXToolbar("Navigation") → AXGroup → AXComboBox → value`
   - Matches specific windows by title when multiple windows exist
   - Uses `AXIsProcessTrustedWithOptions` with prompt flag to trigger permission dialog
3. **TypeScript orchestrator** (`apps/desktop/src/capture/windowContext.ts`)
   - Calls Swift binary for window info
   - For Firefox-based browsers: calls native addon with PID + window title
   - Falls back to session file (`recovery.jsonlz4`) if addon fails (~15s stale)
   - For Chromium/Safari: uses AppleScript via `osascript`

## Coordinate Systems — Critical Bug We Hit
- The overlay returns selection coordinates in **screen points** (logical coordinates)
- `captureManager.ts` multiplies by `scaleFactor` to get `cropRect` in **physical pixels** for image cropping
- `CGWindowListCopyWindowInfo` returns window bounds in **screen points**
- **Must pass original `rect` (points) to the Swift binary, NOT `cropRect` (pixels)**
- Getting this wrong causes completely wrong window matching on Retina displays

## Browser URL Strategies

### Chromium / Safari / Arc — AppleScript (reliable)
These browsers have native AppleScript scripting dictionaries. Simple `tell application "Google Chrome" to get URL of active tab of front window`. Works from `osascript` spawned by Electron. Rock solid.

### Firefox / Zen / Waterfox / LibreWolf — Native N-API Addon (reliable)
- Firefox removed AppleScript support years ago (open bug for 16+ years)
- We read the URL bar combo box via macOS Accessibility API
- UI path: `window → group 1 → toolbar (description: "Navigation") → group → combo box → value`
- **CRITICAL: Must run in-process via native addon, NOT from osascript or child process** (see TCC section below)
- Session file (`recovery.jsonlz4`) as fallback — works but updates every ~15s, too stale for primary use

## macOS TCC / Accessibility Permission — Hard-Won Knowledge

### The Core Problem
macOS TCC manages Accessibility permissions **per-binary** based on code signing identity. Permission is NOT inherited by child processes — each binary needs its own TCC entry.

### What Doesn't Work (and why)
- **AX from child processes** (Swift binary, osascript): Gets `-25211` (kAXErrorCannotComplete). They're separate binaries with separate TCC identities — they don't have Electron's permission.
- **osascript with System Events from Electron**: Can enumerate UI elements (roles, descriptions) but returns **empty values** for combo box. Reading values requires AX permission, which osascript doesn't have.
- **Ad-hoc signed Electron + Accessibility list**: Shows in System Settings UI but `AXIsProcessTrusted()` returns NO. TCC cannot reliably track ad-hoc signed binaries.
- **Re-signing with `codesign --sign -`**: Still ad-hoc, still broken.

### What Works
1. **Sign Electron.app with Apple Development certificate**:
   ```bash
   codesign --force --deep --sign "Apple Development" node_modules/electron/dist/Electron.app
   ```
   Gives TCC a stable `TeamIdentifier` to anchor the permission to.
2. **Native N-API addon running in-process**: AX calls happen in Electron's PID, using Electron's TCC grant.
3. **`AXIsProcessTrustedWithOptions` with `kAXTrustedCheckOptionPrompt: YES`**: Triggers the macOS system dialog to grant permission. Properly registers the (now stable) code identity.
4. **Automated via `postinstall` script** (`scripts/sign-electron-dev.sh`): Re-signs Electron after `pnpm install`.

### Why Native Addon Instead of osascript
Analogy: Electron has a keycard (AX permission) to enter the building. Child processes (osascript, Swift binary) are couriers with their own identity — security checks *their* badge, not Electron's. The native addon runs inside Electron itself — same person, same keycard.

### Dev Setup Requirements
- Apple Developer certificate in keychain (free Apple Developer account works)
- After first `pnpm install`: grant Accessibility permission when prompted
- Permission persists across restarts because TeamIdentifier is stable
- **Production builds**: Properly signed during packaging, no special setup needed

## Native Addon Build

### Files
- `apps/desktop/native/binding.gyp` — node-gyp config, links ApplicationServices + AppKit, enables ARC
- `apps/desktop/native/src/ax_url_reader.mm` — Obj-C++ N-API addon
- `apps/desktop/src/capture/axUrlReader.ts` — TypeScript wrapper (handles dev vs packaged paths)

### Build Command
```bash
pnpm build:native
# Internally: cd native && node-gyp rebuild --target=<electron-version> --arch=arm64 --dist-url=https://electronjs.org/headers
```

### Vite / Forge Integration
- `vite.main.config.ts`: `build.rollupOptions.external: [/\.node$/]` — prevents Vite from bundling native addons
- `forge.config.ts`: `extraResource: ["./native/build/Release/ax_url_reader.node"]` — ships addon outside ASAR

### Zen Browser Specifics
- Process name in System Events: `"zen"` (lowercase)
- App name for `tell application`: `"Zen"` (not "Zen Browser")
- Bundle ID: `app.zen-browser.zen`
- Window titles do NOT include browser suffix (just the page title, e.g., "Neon Console")
- URL bar shows bare domains without protocol (e.g., `console.neon.tech` not `https://...`)
- Need to prepend `https://` when URL lacks a protocol prefix

## Data Flow
```
Hotkey → overlay → screencapture → user selects region → overlay dismisses
  → 100ms delay (lets window manager settle)
  → Promise.all([resolveWindowContext(rect), requestAuthToken()])
    → Swift binary: window match (returns appName, bundleId, windowTitle, pid)
    → For Firefox-based: native addon AX read (in-process, uses PID)
    → For Chromium/Safari: osascript URL fetch
  → uploadCapture(pngBuffer, token, { sourceApp, sourceUrl })
  → API stores sourceApp + sourceUrl in Capture record
```

## Schema
- `sourceApp`: String? — Page title for browsers (e.g., "Neon Console"), app name otherwise (e.g., "Figma")
- `sourceUrl`: String? — Full URL for browsers, null for non-browser apps
- Migration: `20260223000000_add_source_app`

## Files
- `apps/desktop/swift-helpers/window-info.swift` — Window matching (CGWindowListCopyWindowInfo)
- `apps/desktop/native/binding.gyp` — Native addon build config
- `apps/desktop/native/src/ax_url_reader.mm` — AX URL reader (Obj-C++ N-API)
- `apps/desktop/src/capture/axUrlReader.ts` — TypeScript wrapper for native addon
- `apps/desktop/src/capture/browserUrl.ts` — Chromium/Safari URL via AppleScript + session file fallback
- `apps/desktop/src/capture/windowContext.ts` — Orchestrator
- `apps/desktop/src/capture/captureManager.ts` — Wired into capture pipeline
- `apps/desktop/src/capture/uploader.ts` — Sends sourceApp/sourceUrl as multipart form fields
- `apps/desktop/scripts/sign-electron-dev.sh` — Dev signing script for TCC
- `apps/web/src/app/api/captures/upload/route.ts` — Reads and persists both fields
- `packages/db/prisma/schema.prisma` — sourceApp field added

## Production Reliability
| Component | Reliability | Notes |
|-----------|------------|-------|
| Window matching | High | Stable macOS API, used by many apps |
| Chrome/Safari/Arc URL | High | Stable AppleScript interfaces maintained for years |
| Firefox/Zen URL (addon) | Medium | Depends on toolbar structure staying consistent |
| Session file fallback | Medium | Always works but ~15s stale |
| Graceful fallback | High | Any failure → sourceUrl is null, capture still works |

## Required Permissions
- **Screen Recording** — for `CGWindowListCopyWindowInfo` and `screencapture`
- **Accessibility** — for reading Firefox/Zen URL bar via native addon
- AX prompt triggered automatically via `AXIsProcessTrustedWithOptions` on first use

## Rejected Approaches
- **Frontmost app heuristic**: Wrong when capturing background windows
- **osascript for Firefox AX**: Finds elements but returns empty values (TCC per-binary issue)
- **Swift binary for AX**: Gets -25211 as child process (same TCC issue)
- **Ad-hoc signed Electron for AX**: TCC can't track ad-hoc identities
- **Vector/embedding search for descriptions**: Over-engineered for MVP
- **User-provided descriptions for search**: Pollutes search results
- **AI-inferred source URLs from screenshots**: Not accurate enough

## Detail View Brainstorm (Not Yet Built)
- Modal overlay: image left, metadata panel right
- Show AI tags as pills, source app/URL, capture date
- Jobs to be done: Inspect & Study, Organize & Curate, Export & Share
- Considered but deferred: user notes, collections, related captures, color palette extraction
- Navigation: arrow keys to cycle through captures in grid

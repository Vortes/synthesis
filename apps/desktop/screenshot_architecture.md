# Screenshot Capture Architecture

## Current Flow (slow — ~1s delay)

When the user presses the capture hotkey:

1. `main.ts` → `startCapture()` in `captureManager.ts`
2. `desktopCapturer.getSources({ types: ["screen"], thumbnailSize })` — **the bottleneck**
3. Extract `primarySource.thumbnail` (a `NativeImage`)
4. `capturedScreenshot.toDataURL()` — serialize full screenshot to base64
5. `activateOverlay(screenshotDataUrl)` — send base64 string over IPC to overlay renderer
6. Overlay renderer decodes base64 into an `Image`, draws on canvas
7. Overlay signals back `overlay:screenshot-ready`, main process makes overlay visible

Steps 2 + 4 + 5 account for the ~1 second delay.

## Why `desktopCapturer.getSources()` Is Slow

Electron's `desktopCapturer` uses Chromium's internal screen capture pipeline. This:

- Enumerates all available capture sources (screens + windows)
- Generates full-resolution thumbnails synchronously
- Freezes all renderer processes during execution ([electron#8246](https://github.com/electron/electron/issues/8246))

On a Retina display (e.g. 2880×1800), requesting a thumbnail at native resolution is particularly expensive.

The `toDataURL()` call then serializes that multi-megabyte image to a base64 string, which is sent over IPC and decoded again in the overlay renderer — redundant serialization overhead.

## Proposed Fix: macOS `screencapture` CLI

Replace `desktopCapturer.getSources()` with the native macOS `screencapture` command, which calls Apple's `CGWindowListCreateImage` / ScreenCaptureKit directly. Typical execution is well under 100ms.

### New flow

1. `startCapture()` runs `screencapture -x -t png /tmp/synthesis-capture.png`
2. Read the file back: `nativeImage.createFromBuffer(fs.readFileSync(tmpPath))`
3. Pass the **file path** to the overlay (not a data URL) — overlay loads via `file://` protocol
4. Rest of the pipeline (crop, upload) stays the same since we still have a `NativeImage`

### Flags

- `-x` — suppress shutter sound
- `-t png` — output as PNG

### What stays the same

- Overlay window lifecycle (pre-created, shown/hidden)
- IPC for region selection (`capture:region-selected`) and cancel (`capture:cancel`)
- `handleRegionSelected` — still calls `capturedScreenshot.crop()` on a `NativeImage`
- Auth token flow, thumbnail display, upload pipeline — all untouched

### What changes

| Component | Before | After |
|---|---|---|
| Screenshot acquisition | `desktopCapturer.getSources()` | `child_process.execFile("screencapture", ...)` |
| Image transfer to overlay | base64 data URL over IPC | file path over IPC, overlay loads via `file://` |
| Cleanup | none needed | delete temp file after capture completes/cancels |

### Considerations

- **macOS only** — `screencapture` is a macOS command. Can keep `desktopCapturer` as a cross-platform fallback if needed later.
- **Permissions** — requires the same Screen Recording permission already granted for `desktopCapturer`. No new prompts.
- **Temp file** — written to `/tmp/synthesis-capture.png`, must be cleaned up on capture complete, cancel, or error.
- **Overlay signature change** — `onScreenshot` callback receives a file path instead of a data URL. The overlay HTML loads it as `file://` in an `Image` element. Self-contained change since the overlay is an inline HTML string.

---

## Implementation Phases

### Phase 1: Replace `desktopCapturer` with `screencapture` CLI

**What:** Swap the screenshot acquisition method in `captureManager.ts`. Keep everything else identical — still convert to data URL, still send over IPC the same way.

**Changes:**
- `captureManager.ts` → `startCapture()`: replace `desktopCapturer.getSources()` with `execFile("screencapture", ["-x", "-t", "png", tmpPath])`, then `nativeImage.createFromBuffer(fs.readFileSync(tmpPath))`
- Remove `desktopCapturer` import
- Add `child_process.execFile`, `fs`, `os` imports
- Add temp file cleanup in `handleRegionSelected` finally block and `capture:cancel` handler

**Test:** Press hotkey → overlay appears. The delay should already be noticeably shorter. Region select, crop, upload should all still work exactly as before since `capturedScreenshot` is still a `NativeImage`.

**Rollback:** If something breaks, revert this one file back to `desktopCapturer`.

---

### Phase 2: Pass file path to overlay instead of data URL

**What:** Eliminate the base64 serialization overhead. Instead of `capturedScreenshot.toDataURL()` → IPC → `new Image(dataUrl)`, pass the temp file path and let the overlay load it as `file://`.

**Changes:**
- `captureManager.ts` → `activateOverlay(tmpFilePath)` instead of `activateOverlay(screenshotDataUrl)`
- `overlayWindow.ts` → `activateOverlay` sends a file path string instead of a data URL
- `overlayWindow.ts` → overlay HTML `onScreenshot` callback: set `screenshotImage.src = "file://" + path` instead of a data URL
- `overlay-preload.ts` → no change (already passes a string through)

**Test:** Press hotkey → overlay appears with the screenshot rendered correctly. Visually identical to Phase 1. Region select still works. Time from hotkey to overlay visible should be slightly faster (saves the toDataURL + IPC serialization of a multi-MB base64 string).

---

### Phase 3: Temp file lifecycle hardening

**What:** Make temp file management robust. Ensure cleanup in all code paths (success, cancel, error, app quit).

**Changes:**
- Use `os.tmpdir()` + unique filename (e.g. `synthesis-capture-${Date.now()}.png`) to avoid collisions
- Cleanup temp file in: `handleRegionSelected` finally block, `capture:cancel` handler, `startCapture` error catch
- Add `app.on("will-quit")` cleanup as a safety net
- Guard against stale temp files from previous crashed sessions on startup

**Test:** Trigger captures, cancels, and forced quits in various sequences. Verify `/tmp` doesn't accumulate `synthesis-capture-*.png` files.

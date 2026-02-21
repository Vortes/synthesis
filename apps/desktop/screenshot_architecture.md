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

---

## Instant-Feel Capture: Show Overlay First, Screenshot Second

### Problem

Even with `screencapture` CLI, there's a ~150-200ms gap between the hotkey press and the overlay becoming visible. The user sees nothing happen during that time.

### Idea

Show the overlay **immediately** on hotkey press with a crosshair cursor, then load the screenshot asynchronously. The overlay is pre-created, full-screen, and transparent — if we make it visible without drawing anything on the canvas, the user sees their actual desktop through it with a crosshair cursor. Once the screenshot loads (~150ms later), it draws on the canvas and the custom crosshair takes over. Human reaction time to move the mouse and start dragging is ~200-400ms — by then the screenshot has loaded and the user never notices it wasn't there from the start.

This also avoids the problem of `screencapture` capturing the overlay itself — since the overlay is fully transparent during the capture, there's nothing to capture.

### Key concern: double-overlay on rapid re-trigger

If the user presses the hotkey while a capture is already in progress, we must not stack a second overlay on top. The `startCapture()` function must guard against this — if the overlay is already active (in either the "waiting for screenshot" or "screenshot loaded" state), the hotkey press is ignored.

### New flow

1. Hotkey → `startCapture()` → **immediately** call `activateOverlay()` (no screenshot yet)
2. Overlay becomes visible: transparent canvas (desktop shows through) + CSS `cursor: crosshair`
3. In parallel: `screencapture` runs → captures real desktop (overlay is transparent, invisible to capture)
4. File written → file path sent to overlay via `setOverlayScreenshot(path)`
5. Overlay loads image, draws on canvas, switches from CSS crosshair to custom drawn crosshair
6. Selection drag is blocked until the screenshot is loaded (CSS crosshair still tracks)
7. Rest of pipeline unchanged (region selected → crop → upload)

### What stays the same

- Overlay window lifecycle (pre-created, shown/hidden)
- IPC for region selection and cancel
- `handleRegionSelected`, crop, upload — all untouched
- Temp file management

### What changes

| Component | Before | After |
|---|---|---|
| Overlay activation | After screenshot is captured and loaded | Immediately on hotkey |
| Overlay initial state | Shows screenshot immediately | Transparent (desktop visible) + CSS crosshair cursor, screenshot loads async |
| Canvas cursor CSS | `cursor: none` always | `cursor: crosshair` while loading, `cursor: none` after screenshot loaded |
| Selection start (`mousedown`) | Allowed immediately | Blocked until screenshot is loaded |
| `startCapture()` re-entry | Not guarded | Returns early if overlay is already active |
| `activateOverlay` signature | `activateOverlay(filePath)` | `activateOverlay()` (no args), then `setOverlayScreenshot(filePath)` |

---

### Implementation Phases

#### Phase 4: Guard `startCapture()` against re-entry

**What:** Prevent double-overlay if the user presses the hotkey while a capture is already in progress. This is a prerequisite for showing the overlay before the screenshot is ready — without it, rapid hotkey presses during the async gap could stack overlays.

**Changes:**
- `captureManager.ts` → add an `isCaptureInProgress` flag
- `startCapture()` → return early if `isCaptureInProgress` is `true` or if `isOverlayActive()` returns `true`
- Clear the flag in `capture:cancel` handler, `handleRegionSelected` finally block, and `startCapture` error catch

**Test:**
1. Press hotkey → overlay appears
2. While overlay is visible, press hotkey again → nothing happens (no second overlay, no flash, no error in console)
3. Press Escape → overlay dismisses normally
4. Press hotkey again → new capture starts normally

**Rollback:** Remove the flag check — reverts to current behavior.

---

#### Phase 5: Optimistic crosshair — show overlay immediately, screenshot loads async

**What:** Make the overlay visible **instantly** on hotkey press with a CSS crosshair cursor over a transparent canvas (desktop shows through). Run `screencapture` in parallel. Once the screenshot file is ready, load it into the canvas and switch to the custom drawn crosshair. Selection drag is blocked until the screenshot is loaded.

Since the overlay is fully transparent during the `screencapture` call, it won't be captured in the screenshot.

**Changes:**

`overlayWindow.ts`:
- `activateOverlay()` → takes no arguments. Makes overlay visible (opacity 1, accepts mouse events, gains focus) immediately. Sends `overlay:activate` to the renderer (triggers CSS crosshair + waiting state).
- New `setOverlayScreenshot(filePath)` → sends `overlay:screenshot` with the file path, same as today.
- `overlay:screenshot-ready` IPC handler → no longer controls visibility (overlay is already visible). Just marks screenshot as loaded internally.

`overlayWindow.ts` overlay HTML:
- Canvas CSS: default `cursor: crosshair` instead of `cursor: none`.
- New `screenshotReady` flag, starts `false`.
- New `onActivate` handler: resets state (`screenshotReady = false`, clears canvas). Canvas stays transparent, CSS crosshair is visible.
- `onScreenshot` handler: loads the image, sets `screenshotReady = true`, switches canvas CSS to `cursor: none`, calls `draw()` (which now draws the image + custom crosshair).
- `mousedown` listener: only starts a selection if `screenshotReady === true`.
- `draw()`: returns early without drawing if `screenshotReady` is false (canvas stays transparent). When true, draws screenshot + dim + custom crosshair as before.
- `mousemove` listener: always tracks `mouseX`/`mouseY`, but only calls `draw()` if `screenshotReady` is true (no need to redraw a transparent canvas).

`overlay-preload.ts`:
- Expose `onActivate` callback (same pattern as `onScreenshot`).

`captureManager.ts` → `startCapture()`:
1. Check re-entry guard (from Phase 4)
2. Set `isCaptureInProgress = true`
3. Call `activateOverlay()` — overlay visible immediately with CSS crosshair
4. Run `screencapture` CLI (async)
5. Read file, create `NativeImage`, call `setOverlayScreenshot(tmpPath)`
6. If `screencapture` fails, call `deactivateOverlay()` and clean up

**Test:**
1. Press hotkey → crosshair cursor appears **instantly** over the live desktop
2. ~150ms later, the screenshot + dim fills in — should be seamless since the screenshot matches what the user was already looking at
3. Try to click/drag before the screenshot loads → nothing happens (crosshair tracks but no selection starts)
4. After screenshot loads, drag a selection → region select, crop, upload all work
5. Press Escape during the "waiting for screenshot" phase → overlay dismisses, temp file cleaned up
6. Rapid double-tap hotkey → only one overlay (Phase 4 guard)

**Rollback:** Revert to single-step `activateOverlay(filePath)` — back to Phase 3 behavior.

---

#### Phase 6: Polish and edge cases

**What:** Handle edge cases discovered during Phase 5 testing.

**Potential items** (confirm during Phase 5 testing):
- Cancel during `screencapture` execution: ensure the `execFile` child process is killed, not just ignored
- Error states: if `screencapture` fails (e.g. permission revoked), show a brief error indication before dismissing the overlay rather than silently failing
- Verify `screencapture` does not capture the transparent overlay (expected: it doesn't, but must confirm)

**Test:** Varies by item — each fix should have a specific repro and verification step.

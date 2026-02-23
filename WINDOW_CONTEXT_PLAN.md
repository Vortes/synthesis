# Window Context Capture — Implementation Plan

## Goal
When a user takes a screenshot, automatically detect which application and window the selected region belongs to, and store the app name and URL (if it's a browser) alongside the capture.

## Architecture Overview

```
Hotkey pressed
  → activateOverlay()                          // existing, unchanged
  → screencapture                              // existing, unchanged
  → user selects region                        // existing, unchanged
  → overlay dismisses
  → resolveWindowContext(selectedRect)          // NEW — runs post-selection
     → Swift CLI: get all visible window bounds
     → match selected region to best-overlapping window
     → if matched app is a browser, grab URL via AppleScript
  → uploadCapture(pngBuffer, token, context)   // CHANGED — includes context
  → API stores sourceApp + sourceUrl            // CHANGED — persists context
```

---

## Phase 1: Swift Window Matcher CLI

**What:** Create a standalone Swift command-line tool that takes a screen region as input and returns the best-matching visible window's owner app name and bounds.

**Why first:** This is the core novel piece — everything else is plumbing. Testing this in isolation confirms the approach works before wiring it into Electron.

### Files to create

**`apps/desktop/swift-helpers/window-info.swift`**

A single-file Swift script compiled with `swiftc`. It should:

1. Accept 4 command-line arguments: `x y width height` (the selected region in screen coordinates, already scaled by the display's scaleFactor — the caller is responsible for scaling)
2. Call `CGWindowListCopyWindowInfo(.optionOnScreenOnly, kCGNullWindowID)` to get all visible windows
3. Filter out windows owned by `"Synthesis"` (our own app) and windows with empty names or layer > 0 (menu bar, dock, etc.)
4. For each remaining window, compute the intersection area between the window bounds (`kCGWindowBounds`) and the input region
5. Return the window with the highest overlap area (intersection area / selected region area)
6. Output JSON to stdout:
   ```json
   { "appName": "Google Chrome", "bundleId": "com.google.Chrome", "windowTitle": "Stripe Dashboard — Payments" }
   ```
7. If no matching window is found (e.g., user selected empty desktop), output:
   ```json
   { "appName": null, "bundleId": null, "windowTitle": null }
   ```
8. Exit code 0 on success, non-zero on failure

**Key implementation details for the Swift code:**
- Import `CoreGraphics` and `Foundation`
- Use `CGWindowListCopyWindowInfo(.optionOnScreenOnly, kCGNullWindowID)` which returns a `CFArray` of `CFDictionary`
- Each window dict has keys: `kCGWindowOwnerName` (String), `kCGWindowBounds` (Dict with X/Y/Width/Height), `kCGWindowLayer` (Int), `kCGWindowOwnerPID` (Int), `kCGWindowName` (String, may be empty)
- The bounds dict from `kCGWindowBounds` uses `CGRectMakeWithDictionaryRepresentation` to parse
- Bundle ID is available via `NSRunningApplication(processIdentifier: pid)?.bundleIdentifier`
- Intersection calculation: use `CGRect.intersection()` then check `.width * .height` for area
- Only consider windows where `kCGWindowLayer == 0` (normal windows, not system UI)
- Serialize output with `JSONSerialization`

**Build step:**
```bash
swiftc apps/desktop/swift-helpers/window-info.swift -o apps/desktop/swift-helpers/window-info -framework CoreGraphics -framework AppKit
```

### How to test Phase 1

Run manually from terminal:
```bash
# Open a browser window, note its approximate screen position
# Run the compiled binary with a region that overlaps the browser
./apps/desktop/swift-helpers/window-info 100 200 800 600
# Should output JSON with the browser's app name
```

Test cases:
- Region fully inside one window → returns that window's app
- Region overlapping two windows → returns the one with more overlap
- Region over empty desktop → returns `{ "appName": null, ... }`
- Region over the dock/menu bar → returns null (filtered by layer > 0)

---

## Phase 2: Browser URL Resolution

**What:** Create a TypeScript module that, given an app name/bundle ID, determines if it's a browser and fetches the active tab's URL using AppleScript.

### Files to create

**`apps/desktop/src/capture/browserUrl.ts`**

This module exports a single function:

```typescript
export async function getBrowserUrl(appName: string): Promise<string | null>
```

**Implementation:**

1. Define a map of known browsers and their AppleScript commands:

```typescript
const BROWSER_SCRIPTS: Record<string, string> = {
  "Google Chrome": 'tell application "Google Chrome" to get URL of active tab of front window',
  "Google Chrome Canary": 'tell application "Google Chrome Canary" to get URL of active tab of front window',
  "Brave Browser": 'tell application "Brave Browser" to get URL of active tab of front window',
  "Microsoft Edge": 'tell application "Microsoft Edge" to get URL of active tab of front window',
  "Arc": 'tell application "Arc" to get URL of active tab of front window',
  "Safari": 'tell application "Safari" to get URL of front document',
  "Safari Technology Preview": 'tell application "Safari Technology Preview" to get URL of front document',
};
```

2. For Firefox-based browsers (Firefox, Zen, Waterfox, etc.), use the Accessibility API approach. Define a list of known Firefox-based process names:

```typescript
const FIREFOX_BASED = ["firefox", "zen", "waterfox", "librewolf", "Firefox", "zen", "Waterfox", "LibreWolf"];
```

The AppleScript for Firefox-based browsers (the `appName` variable must be interpolated):
```applescript
tell application "System Events"
    tell application process "<appName>"
        try
            return value of combo box 1 of group 1 of toolbar 1 of group 1 of window 1
        on error
            try
                return value of combo box 1 of group 1 of (first toolbar whose description is "Navigation") of group 1 of window 1
            on error
                return ""
            end try
        end try
    end tell
end tell
```

3. Function logic:
   - Check if `appName` matches a key in `BROWSER_SCRIPTS` → use that script
   - Check if `appName.toLowerCase()` matches any entry in `FIREFOX_BASED` → use the Firefox accessibility script with the app name inserted
   - Otherwise → return `null` (not a browser)
   - Execute the chosen script via `execFile("osascript", ["-e", script])`
   - Wrap in a 2-second timeout — if it takes longer, resolve `null`
   - Validate the result looks like a URL (starts with `http://`, `https://`, or `file://`). If not, return `null`.
   - Trim whitespace from the result before returning

**Important:** Use `child_process.execFile` (not `exec`) and pass the script as a `-e` argument. Do NOT use template literals to interpolate user-controlled strings into the AppleScript — use a fixed set of known app names only.

### How to test Phase 2

Create a temporary test script or call the function from the Electron main process console:
```typescript
// With Chrome open and focused:
const url = await getBrowserUrl("Google Chrome");
console.log(url); // Should print the active tab's URL

// With Zen open:
const url = await getBrowserUrl("zen");
console.log(url); // Should print the Zen active tab's URL

// With Figma:
const url = await getBrowserUrl("Figma");
console.log(url); // Should print null
```

---

## Phase 3: Window Context Orchestrator

**What:** Create the main orchestrator module that combines Phase 1 (Swift window matcher) and Phase 2 (browser URL resolution) into a single async function that the capture manager calls.

### Files to create

**`apps/desktop/src/capture/windowContext.ts`**

Exports:
```typescript
export interface WindowContext {
  sourceApp: string | null;
  sourceUrl: string | null;
}

export async function resolveWindowContext(
  selectedRect: { x: number; y: number; width: number; height: number }
): Promise<WindowContext>
```

**Implementation:**

1. Call the Swift binary via `execFile`:
   ```typescript
   const swiftBinaryPath = path.join(__dirname, "../../swift-helpers/window-info");
   ```
   Pass `selectedRect.x`, `selectedRect.y`, `selectedRect.width`, `selectedRect.height` as string arguments. These should be the **physical pixel coordinates** (already multiplied by scaleFactor — the caller in captureManager.ts handles this).

   **Important path resolution:** In a packaged Electron app, `__dirname` points to the compiled JS output, not the source directory. For development, resolve the path relative to the project root. Use `app.isPackaged` to determine the correct path:
   - Development: `path.join(app.getAppPath(), "swift-helpers/window-info")`
   - Production: `path.join(process.resourcesPath, "swift-helpers/window-info")`

   The binary must be included in the Electron Forge package config later (noted as follow-up, not part of this plan).

2. Parse the JSON stdout from the Swift binary
3. If `appName` is non-null, call `getBrowserUrl(appName)` from Phase 2
4. Return `{ sourceApp: appName, sourceUrl: urlOrNull }`
5. Wrap the entire function in a try/catch — if anything fails, return `{ sourceApp: null, sourceUrl: null }`. Window context is best-effort and must never prevent a capture from completing.
6. Add an overall timeout of 3 seconds for the entire resolution. If it takes longer, return the default null context.

### How to test Phase 3

Call `resolveWindowContext` with known screen coordinates that overlap a visible browser window. Verify both `sourceApp` and `sourceUrl` are populated. Then test with coordinates over a non-browser app — verify `sourceApp` is set but `sourceUrl` is null.

---

## Phase 4: Integrate into Capture Pipeline

**What:** Wire `resolveWindowContext` into the existing capture manager and uploader so that window context is captured and sent to the server.

### Files to modify

**`apps/desktop/src/capture/captureManager.ts`**

In the `handleRegionSelected` function (starts at line 159):

1. Add import at top of file:
   ```typescript
   import { resolveWindowContext, type WindowContext } from "./windowContext";
   ```

2. After cropping the image and before calling `uploadCapture`, call `resolveWindowContext` with the **physical pixel coordinates** (the `cropRect` that's already been scaled by `scaleFactor`):
   ```typescript
   const cropped = capturedScreenshot.crop(cropRect);
   const pngBuffer = cropped.toPNG();

   showThumbnail(cropped.toDataURL());

   // NEW: resolve window context using the scaled coordinates
   const context = await resolveWindowContext(cropRect);

   const token = await requestAuthToken();
   if (!token) {
     console.error("[capture] No auth token available");
     return;
   }

   const result = await uploadCapture(pngBuffer, token, context);
   ```

   **Note:** `resolveWindowContext` and `requestAuthToken` could run in parallel since they're independent. Optimize by calling both with `Promise.all`:
   ```typescript
   const [context, token] = await Promise.all([
     resolveWindowContext(cropRect),
     requestAuthToken(),
   ]);
   ```

**`apps/desktop/src/capture/uploader.ts`**

1. Change the function signature to accept context:
   ```typescript
   import type { WindowContext } from "./windowContext";

   export async function uploadCapture(
     pngBuffer: Buffer,
     authToken: string,
     context: WindowContext
   ): Promise<{ id: string; imageUrl: string } | null>
   ```

2. Add `sourceApp` and `sourceUrl` as additional form-data text fields in the multipart body. Add them as separate parts before the closing boundary:
   ```
   --boundary
   Content-Disposition: form-data; name="image"; filename="capture-123.png"
   Content-Type: image/png

   <png bytes>
   --boundary
   Content-Disposition: form-data; name="sourceApp"

   Google Chrome
   --boundary
   Content-Disposition: form-data; name="sourceUrl"

   https://stripe.com/dashboard
   --boundary--
   ```

   Only include `sourceApp` part if `context.sourceApp` is non-null. Only include `sourceUrl` part if `context.sourceUrl` is non-null.

   To construct this, build an array of Buffer parts and concat them:
   ```typescript
   const parts: Buffer[] = [];

   // Image part (existing)
   parts.push(Buffer.from(
     `--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="${filename}"\r\nContent-Type: image/png\r\n\r\n`
   ));
   parts.push(pngBuffer);
   parts.push(Buffer.from("\r\n"));

   // sourceApp part (new, conditional)
   if (context.sourceApp) {
     parts.push(Buffer.from(
       `--${boundary}\r\nContent-Disposition: form-data; name="sourceApp"\r\n\r\n${context.sourceApp}\r\n`
     ));
   }

   // sourceUrl part (new, conditional)
   if (context.sourceUrl) {
     parts.push(Buffer.from(
       `--${boundary}\r\nContent-Disposition: form-data; name="sourceUrl"\r\n\r\n${context.sourceUrl}\r\n`
     ));
   }

   // Closing boundary
   parts.push(Buffer.from(`--${boundary}--\r\n`));

   const body = Buffer.concat(parts);
   ```

### How to test Phase 4

1. Run the desktop app in dev mode (`pnpm dev:desktop`)
2. Open a browser window to a known URL (e.g., `https://example.com`)
3. Take a screenshot of the browser window
4. Check the Electron console logs — add a temporary `console.log("[capture] context:", context)` in `handleRegionSelected` to verify the context is populated
5. Check that the upload request includes the new form fields (add a temporary log in the upload route)

---

## Phase 5: Schema Migration + API Update

**What:** Add `sourceApp` to the Prisma schema and update the upload API route to read and persist `sourceApp` and `sourceUrl` from the form data.

### Files to modify

**`packages/db/prisma/schema.prisma`**

Add `sourceApp` field to the Capture model. The model already has `sourceUrl` (line 28), so only `sourceApp` is new:

```prisma
model Capture {
  id          String    @id @default(cuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  imageUrl    String
  description String?
  tags        String[]  @default([])
  analyzedAt  DateTime?
  sourceApp   String?
  sourceUrl   String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([userId])
}
```

Add `sourceApp` on the line directly before `sourceUrl` (before current line 28) to keep related fields grouped.

**Generate and apply migration:**
```bash
cd packages/db
pnpm prisma migrate dev --name add_source_app
```

**`apps/web/src/app/api/captures/upload/route.ts`**

In the POST handler, after extracting the image file from formData (after line 35), also extract the new text fields:

```typescript
const sourceApp = formData.get("sourceApp");
const sourceUrl = formData.get("sourceUrl");
```

Then include them in the `db.capture.create` call (currently at line 56-61):

```typescript
const capture = await db.capture.create({
  data: {
    userId: user.id,
    imageUrl,
    sourceApp: typeof sourceApp === "string" ? sourceApp : null,
    sourceUrl: typeof sourceUrl === "string" ? sourceUrl : null,
  },
});
```

No other validation needed — these are optional metadata fields. The `typeof` check ensures we don't store `File` objects or other unexpected types.

### How to test Phase 5

1. Run the migration: `pnpm prisma migrate dev --name add_source_app`
2. Verify the migration was created in `packages/db/prisma/migrations/`
3. Start the web app: `pnpm dev:web`
4. Take a capture from the desktop app with a browser window visible
5. Query the database directly to verify `sourceApp` and `sourceUrl` are stored:
   ```bash
   pnpm prisma studio
   ```
   Open Prisma Studio and check the Capture table — the new capture should have both fields populated.

---

## Phase 6: Build Integration

**What:** Compile the Swift binary and ensure it's available to the Electron app during development.

### Steps

1. **Compile the Swift binary:**
   ```bash
   mkdir -p apps/desktop/swift-helpers
   swiftc apps/desktop/swift-helpers/window-info.swift \
     -o apps/desktop/swift-helpers/window-info \
     -framework CoreGraphics \
     -framework AppKit
   ```

2. **Add a build script to `apps/desktop/package.json`:**
   Add to the `"scripts"` section:
   ```json
   "build:swift": "swiftc swift-helpers/window-info.swift -o swift-helpers/window-info -framework CoreGraphics -framework AppKit"
   ```
   Update the existing `"build"` script to run `build:swift` first:
   ```json
   "build": "pnpm build:swift && <existing build command>"
   ```

3. **Add the compiled binary to `.gitignore`:**
   Add to `apps/desktop/.gitignore` (create the file if it doesn't exist):
   ```
   swift-helpers/window-info
   ```
   The `.swift` source file should be committed; the compiled binary should not.

4. **Verify the path resolution in `windowContext.ts`** works in development by testing a capture end-to-end.

### How to test Phase 6

```bash
cd apps/desktop
pnpm build:swift
ls -la swift-helpers/window-info  # Should exist and be executable
# Then run a full capture test through the desktop app
```

---

## Execution Order

Phases should be executed in this order: **1 → 6 → 2 → 3 → 4 → 5**

Rationale:
- Phase 1 (Swift CLI) is the foundational piece — build and test it first
- Phase 6 (Build integration) ensures the binary is compiled and accessible before writing code that depends on it
- Phase 2 (Browser URL) is independent of Phase 1 but depends on being able to test with real browsers
- Phase 3 (Orchestrator) combines Phase 1 + 2
- Phase 4 (Capture pipeline) wires it into the app
- Phase 5 (Schema + API) is last because it requires the desktop app changes to send the new fields

Each phase is independently testable before moving to the next.

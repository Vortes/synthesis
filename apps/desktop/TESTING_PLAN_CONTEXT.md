# Project Context for Testing Infrastructure Research

This document provides a technical breakdown of the `@curate/desktop` application to assist in identifying the most effective testing infrastructure.

## 1. Technical Stack

- **Runtime:** Electron 34 (Node.js + Chromium)
- **Package Manager:** pnpm
- **Frontend:** React 19, TypeScript 5, Vite 6
- **Styling:** Tailwind CSS v4 (Vite plugin)
- **API/Data Flow:** tRPC v11 with TanStack Query v5
- **Build System:** Electron Forge with Vite Plugin
- **Native Extensions:**
  - Objective-C++ (N-API) for macOS Accessibility API access.
  - Swift CLI binary for window management and screen coordinates.

## 2. Process Architecture

The application consists of several distinct processes that require different testing strategies:

### A. Main Process (Node.js)

- **Responsibilities:** App lifecycle, IPC handlers, OAuth 2.0 (Clerk) flow, Global Hotkeys, Native module integration, Window management.
- **Testing Needs:** Unit tests for logic, integration tests for IPC and native module calls, mocking of Electron APIs.

### B. Preload Scripts

- **Responsibilities:** Securely exposing APIs to the Renderer via `contextBridge`.
- **Testing Needs:** Ensuring the security boundary is intact and that exposed functions correctly proxy to the Main process.

### C. Renderer Process (React)

- **Responsibilities:** Main UI, Library view, Settings.
- **Testing Needs:** Component unit testing, Hook testing, tRPC client mocking, and end-to-end (E2E) testing of user flows.

### D. Overlay Process (React/Transparent Window)

- **Responsibilities:** A transparent, always-on-top window used for screen capture selection.
- **Testing Needs:** Testing visual coordinates, click-through behavior, and communication with the Main process during capture events.

## 3. Unique Testing Challenges

1.  **Native macOS Integration:** The app relies on `CGWindowListCopyWindowInfo` (Swift) and Accessibility APIs (Obj-C++). Testing these typically requires a macOS environment and potentially bypassing or mocking system permissions.
2.  **OAuth Flow:** Testing the Clerk OAuth flow (RFC 8252) which involves opening external browsers and handling deep links.
3.  **Cross-Process IPC:** Validating the data flow between Main and multiple Renderer instances (Main Window vs. Overlay Window).
4.  **Hardware/System Interaction:** Screen capture logic depends on display arrangements, resolutions, and macOS permissions (Screen Recording, Accessibility).
5.  **Monorepo Integration:** The app uses `@curate/api`, `@curate/styles`, and `@curate/ui` from a workspace. Tests need to account for these local dependencies.

## 4. Specific Goals for Testing Infrastructure

We are looking for a setup that supports:

- **Integration Testing:** Testing the Main process logic and IPC without necessarily launching a full UI.
- **End-to-End (E2E) Testing:** Full application flow tests (e.g., Playwright with Electron support or Spectron/WebdriverIO).
- **Native Mocking:** Strategies for mocking the Swift binary and Node-API module during CI.
- **CI/CD Compatibility:** Ability to run tests in a headless environment (noting macOS requirements for native features).

## 5. Current Scripts (from package.json)

```json
"scripts": {
  "dev": "electron-forge start",
  "build:swift": "swiftc swift-helpers/window-info.swift -o swift-helpers/window-info ...",
  "build:native": "cd native && node-gyp rebuild ...",
  "build": "pnpm build:swift && pnpm build:native && electron-forge make"
}
```

## 6. Critical Infrastructure & Testing Use Cases

Based on an analysis of the codebase, the following critical infrastructure areas must be covered by our testing strategy. These are the core workflows that distinguish the app and have a high likelihood of regressions due to OS-level or external dependencies.

### A. Screen Capture & Overlay Window Lifecycle
**Files:** `src/capture/captureManager.ts`, `src/capture/overlayWindow.ts`
**Logic:** Executes `screencapture`, manages a persistent transparent click-through window, and handles cross-process communication for coordinates and passing images via `file://`.
*   **Integration Testing:** 
    *   Mock `execFile("screencapture")` to simulate successful screenshot creation or failure (e.g., missing permissions). 
    *   Test IPC messaging (`overlay:activate`, `overlay:screenshot`, `capture:region-selected`, `capture:cancel`) between the Main process and Overlay without rendering a real window, ensuring state (`isCaptureInProgress`, `isActive`) remains robust against rapid successive hotkey presses or premature escapes.
*   **E2E Testing:** 
    *   Simulate triggering the global capture hotkey.
    *   Verify the overlay window becomes active, opaque, and receives the screenshot image.
    *   Simulate user region selection and verify that `captureManager` correctly crops the `nativeImage`.

### B. OAuth 2.0 (PKCE) & Token Management
**Files:** `src/main.ts`, `src/auth/tokenStorage.ts`, `src/auth/tokenRefresh.ts`
**Logic:** Handles Clerk PKCE flow (Code Verifier, State, Challenge), OS-level Deep Linking (`app.on("open-url")`), token persistence using `safeStorage`, and proactive background token refreshing.
*   **Integration Testing:** 
    *   Mock `safeStorage` (encryption/decryption) and `fs` to test token persistence and loading.
    *   Mock `fetch` to simulate exchanging auth codes for tokens and the proactive `refreshAccessToken` loop.
    *   Verify how the app behaves when the OS keychain is unavailable or throws a permission error (e.g., falling back gracefully, clearing stale tokens).
*   **E2E Testing:** 
    *   Simulate the OS triggering the custom `curate://` deep link protocol. 
    *   Verify that the app correctly extracts the code and matches the cached `pendingState` (CSRF prevention) before attempting token exchange.

### C. Native macOS Modules (Accessibility & Window Info)
**Files:** `src/capture/axUrlReader.ts`, `src/capture/windowContext.ts`, `native/src/ax_url_reader.mm`, `swift-helpers/window-info.swift`
**Logic:** C++ N-API addon (`readBrowserUrl`) to read URLs from Firefox/browsers and Swift CLI utility to fetch `CGWindowListCopyWindowInfo` for contextual metadata.
*   **Integration Testing:** 
    *   Since CI environments often lack UI and TCC (Transparency, Consent, and Control) permissions, we must mock these modules entirely.
    *   Crucially, test the failure modes: what happens if the Swift script throws a timeout, or the N-API module returns `null` because it lacks Accessibility permissions? Ensure the capture still succeeds, gracefully degrading to omit the metadata rather than crashing the app.

### D. File Upload & Context Aggregation
**Files:** `src/capture/captureManager.ts`, `src/capture/uploader.ts`
**Logic:** Aggregates the cropped `nativeImage` buffer, the resolved window context (URL, title), and the OAuth access token to push the final capture to the backend API.
*   **Integration Testing:**
    *   Mock the API endpoint / tRPC client to verify the correct payload (image buffer and metadata) is constructed and transmitted.
*   **E2E Testing:**
    *   Stand up a local mock server and execute the entire pipeline: Hotkey → Region Selection → Crop → Context Resolution → API Upload → Verification of Success IPC message sent to the Main Window.
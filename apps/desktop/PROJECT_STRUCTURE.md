# Curate Desktop App: Structure & Environments

This document breaks down the structure of the `@curate/desktop` application and outlines the recommended strategy for managing Development, Staging, and Production environments during build time.

---

## 1. Project Structure Breakdown

The desktop app is built with **Electron, React, Vite, and tRPC**, utilizing **Electron Forge** for building and packaging. It also incorporates native macOS components (Swift and Objective-C++) for specific screen-capture capabilities.

### Root Configuration
- **`package.json`**: Defines dependencies and build scripts (native modules, swift binaries, electron-forge).
- **`forge.config.ts`**: The core Electron Forge configuration. Handles packaging, DMG/ZIP creation, macOS code signing/notarization, and incorporates the Vite plugin to build the different Electron processes.
- **`vite.*.config.ts`**: Dedicated Vite configurations for each process:
  - `vite.main.config.ts`: Builds the Node.js main process.
  - `vite.preload.config.ts`: Builds the context bridge preload scripts.
  - `vite.renderer.config.ts`: Builds the React frontend.
  - `vite.overlay.config.ts`: Builds the transparent screen capture overlay.

### Source Code (`/src`)
- **`main.ts`**: The Electron Main Process entry point. Orchestrates window creation, app lifecycle, IPC handlers, global hotkeys, and the OAuth flow.
- **`preload.ts`**: The secure bridge between the Main process and the Renderer, exposing specifically allowed APIs via `window.electronAPI`.
- **`/auth`**:
  - Contains the RFC 8252 (OAuth 2.0 for Native Apps) implementation using Clerk.
  - Handles token exchange, refresh polling, and secure storage via macOS Keychain (`safeStorage`).
- **`/capture`**:
  - The core screen capture engine.
  - Orchestrates the hidden transparent overlay (`overlayWindow.ts`, `overlay-renderer.ts`).
  - Integrates with the native Swift binary (`windowContext.ts`) and Accessibility API (`axUrlReader.ts`) to determine the context (URL, App Name) of what is being captured.
  - Handles uploading the resulting image to the web server.
- **`/renderer`**:
  - The React frontend application.
  - Uses `TRPCProvider.tsx` to communicate with the web app's backend.
  - Contains the `LibraryView.tsx` for displaying user captures.

### Native Extensions
- **`/native`**: Contains an N-API/Objective-C++ module (`ax_url_reader.mm`) used to read URLs from Firefox-based browsers using the macOS Accessibility API.
- **`/swift-helpers`**: Contains a Swift CLI binary (`window-info.swift`) that uses `CGWindowListCopyWindowInfo` to determine which window is currently underneath the user's capture selection.

---

## 2. Environment Management (Dev, Staging, Prod)

Currently, the app relies on `NODE_ENV` to switch between `.env` and `.env.production`. For a robust Dev / Staging / Prod setup, we need to separate the *build mode* (which Vite uses for minification) from the *app environment* (which dictates API URLs and Client IDs).

### The Recommended Strategy: `APP_ENV`

We recommend using an `APP_ENV` variable (`development`, `staging`, `production`) to load the correct variables, while letting `NODE_ENV` remain `production` during any build to ensure the code is properly minified and optimized.

#### Step 1: Define Environment Files
Create three distinct environment files in `apps/desktop/`:
- `.env.development` (Local web server, dev Clerk instance)
- `.env.staging` (Staging web server, staging Clerk instance)
- `.env.production` (Production web server, production Clerk instance)

*Note: Remove the base `.env` file from version control to prevent accidental overrides, or keep it strictly for local developer overrides.*

#### Step 2: Update `forge.config.ts`
Modify the top of `forge.config.ts` to load the `.env.[APP_ENV]` file. We use `APP_ENV` to determine which config to load before Forge starts building.

```typescript
import dotenv from "dotenv";
import type { ForgeConfig } from "@electron-forge/shared-types";
import path from "node:path";

// Load the environment file based on APP_ENV, default to development
const appEnv = process.env.APP_ENV || "development";
dotenv.config({ path: path.resolve(__dirname, `.env.\${appEnv}`) });

// ... rest of the config
```

#### Step 3: Update `vite.main.config.ts`
The main process needs to know the correct URLs. Instead of relying on `mode === "production"`, inject variables explicitly based on the loaded environment.

```typescript
import { defineConfig } from "vite";

export default defineConfig(() => {
  return {
    define: {
      // These are injected at build time into the main process code
      "process.env.VITE_WEB_URL": JSON.stringify(process.env.VITE_WEB_URL || "http://localhost:3000"),
      "process.env.CLERK_OAUTH_CLIENT_ID": JSON.stringify(process.env.CLERK_OAUTH_CLIENT_ID ?? ""),
    },
    build: {
      rollupOptions: {
        external: [/\.node$/],
      },
    },
  };
});
```

#### Step 4: Update `package.json` Scripts
Use `cross-env` (or standard bash if you only build on macOS/Linux) to set the variables during the build process.

```json
{
  "scripts": {
    "dev": "APP_ENV=development electron-forge start",
    "build:swift": "swiftc swift-helpers/window-info.swift -o swift-helpers/window-info -framework CoreGraphics -framework AppKit",
    "build:native": "cd native && node-gyp rebuild --target=$(node -e "console.log(require('electron/package.json').version)") --arch=arm64 --dist-url=https://electronjs.org/headers",
    
    "make:staging": "APP_ENV=staging pnpm build:swift && pnpm build:native && electron-forge make",
    "make:prod": "APP_ENV=production pnpm build:swift && pnpm build:native && electron-forge make",
    
    "package:staging": "APP_ENV=staging electron-forge package",
    "package:prod": "APP_ENV=production electron-forge package"
  }
}
```

### How Vite handles the Renderer
By default, Vite's React plugin in the renderer (`vite.renderer.config.ts`) will look for `.env.[mode]`. Electron Forge's Vite plugin automatically sets Vite's `mode` to `development` during `forge start`, and `production` during `forge make`.

Because we want our *Staging* build to be minified like a Production build, but use Staging variables, you have two options for the Renderer:

**Option A (Recommended): Shared Env Variables**
Since the Web URL and Clerk IDs are already needed by the Main process, pass them to the Renderer via IPC or a preload script, rather than having Vite bundle them directly into the Renderer.
Currently, your `TRPCProvider.tsx` uses `import.meta.env.VITE_WEB_URL`. You can change this to be fetched via `window.electronAPI.getEnv()` or simply replace it with IPC requests for data.

**Option B: Vite Mode Mapping**
If you want to keep `import.meta.env` in the React code, you must tell the Forge Vite plugin which mode to use. Unfortunately, Forge hardcodes the Vite mode to `production` during make. To solve this, rely on the `envDir` and explicitly load `dotenv` in `vite.renderer.config.ts` the same way we did in `forge.config.ts`, passing the values into the `define` block.

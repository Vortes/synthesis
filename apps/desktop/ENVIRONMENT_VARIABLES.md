# Environment Variable Loading in `@curate/desktop`

This document explains how environment variables are currently loaded and managed across different build processes in the Curate desktop application.

## Overview of the Build Process

The desktop app uses **Electron Forge** with the **Vite plugin**. This means there are multiple separate build steps happening when you start or package the app:

1. **Electron Forge Configuration**: Orchestrates the packaging and signing.
2. **Main Process Build (`vite.main.config.ts`)**: Compiles the Node.js backend of the app.
3. **Renderer Process Build (`vite.renderer.config.ts`)**: Compiles the React frontend.
4. **Preload Process Build (`vite.preload.config.ts`)**: Compiles the bridge between main and renderer.

Each of these steps handles environment variables slightly differently.

---

## 1. Electron Forge (`forge.config.ts`)

Before any compilation starts, Electron Forge evaluates its configuration file.

*   **How it loads:** It uses the `dotenv` package explicitly.
*   **Default behavior:** It unconditionally loads the `.env` file first.
*   **Production override:** If `process.env.NODE_ENV` is strictly equal to `"production"`, it loads `.env.production` and overwrites any previously loaded variables.
*   **Usage:** These variables are used for build-time operations, primarily macOS code signing and notarization (`APPLE_ID` and `APPLE_PASSWORD`).

```typescript
import dotenv from "dotenv";

dotenv.config({ path: ".env" });
if (process.env.NODE_ENV === "production") {
  dotenv.config({ path: ".env.production", override: true });
}
```

---

## 2. Main Process (`vite.main.config.ts`)

The Main process runs in Node.js. Vite handles its compilation.

*   **How it loads:** It relies on Vite's `define` configuration to statically replace variables in the code at build time.
*   **Hardcoded URLs:** The `VITE_WEB_URL` is not actually loaded from a `.env` file here. Instead, it is hardcoded based on the Vite `mode` (which is controlled by Electron Forge).
    *   If `mode === "production"`, it uses `https://www.curate.is`.
    *   Otherwise, it uses `http://localhost:3000`.
*   **Dynamic injection:** It reads `CLERK_OAUTH_CLIENT_ID` directly from the Node.js `process.env` (which was populated earlier by `forge.config.ts` or the shell) and injects it into the compiled code.

```typescript
export default defineConfig(({ mode }) => ({
  define: {
    "process.env.VITE_WEB_URL": JSON.stringify(
      mode === "production" ? "https://www.curate.is" : "http://localhost:3000"
    ),
    "process.env.CLERK_OAUTH_CLIENT_ID": JSON.stringify(
      process.env.CLERK_OAUTH_CLIENT_ID ?? ""
    ),
  },
  // ...
}));
```

---

## 3. Renderer Process (`vite.renderer.config.ts`)

The Renderer process is your React frontend.

*   **How it loads:** Vite automatically handles environment variables for the frontend.
*   **Configuration:** `envDir: path.resolve(__dirname)` tells Vite to look for `.env` files in the `apps/desktop/` directory.
*   **Vite's built-in resolution:** Vite will automatically load `.env`, `.env.local`, `.env.[mode]`, and `.env.[mode].local`.
*   **Exposure to React:** Only variables prefixed with `VITE_` are exposed to your frontend code via `import.meta.env`.

---

## Environments: Dev, Staging, and Production

The interaction between Electron Forge and Vite creates a specific dynamic for different environments.

### The `mode` behavior
Electron Forge's Vite plugin automatically sets the Vite `mode`:
*   `electron-forge start` (Dev) -> `mode = 'development'`
*   `electron-forge make` or `package` (Prod) -> `mode = 'production'`

### Current State & Limitations
While you have `.env.development` and `.env.staging` files in the `apps/desktop` folder, the current build configuration makes it difficult to do a "Staging Build".

If you run `electron-forge make` to build the app for staging:
1.  Vite's `mode` is forced to `production`.
2.  `vite.main.config.ts` sees `mode === "production"` and hardcodes `VITE_WEB_URL` to the production URL (`https://www.curate.is`).
3.  `vite.renderer.config.ts` will look for `.env.production`, ignoring `.env.staging`.

### Recommended Path Forward
As noted in your `PROJECT_STRUCTURE.md`, to properly support a Staging environment alongside Production, you should decouple the *build minification mode* from the *environment data*.

Instead of relying on `mode === "production"`, the recommended approach is to introduce a custom environment variable like `APP_ENV=staging` when running build commands, and update `forge.config.ts` and `vite.main.config.ts` to read from `APP_ENV` to determine which `.env` file to load and which URLs to inject.

# Phase 6: Shared Styles Package + Electron Sync

> **Depends on:** Phases 0-5 (all complete)

---

## Goal

1. Create `packages/styles/` — single source of truth for the design system
2. Both `apps/web` and `apps/desktop` import from it (one token change affects both)
3. Update Electron app to work with the redesigned shared components

---

## Files to Create (2)

### `packages/styles/package.json`

```json
{
  "name": "@synthesis/styles",
  "version": "0.0.0",
  "private": true,
  "exports": {
    "./globals.css": "./src/globals.css"
  }
}
```

### `packages/styles/src/globals.css`

Full theme extracted from web's `globals.css`: the `@theme` block, keyframes, body styles, grain overlay, scrollbar styles. Does NOT include `@import "tailwindcss"` or `@source` (those differ per app).

---

## Files to Modify (7)

### `apps/web/package.json`
Add `"@synthesis/styles": "workspace:*"` to dependencies.

### `apps/web/src/app/globals.css`
Shrink to 3 lines — import tailwindcss, import shared styles, source directive.

### `apps/desktop/package.json`
Add `"@synthesis/styles": "workspace:*"` to dependencies.

### `apps/desktop/src/renderer/index.css`
Replace old dark theme with same 3-line pattern as web.

### `apps/desktop/src/renderer/main.tsx`
Remove dark mode class, remove dark Clerk theme import.

### `apps/desktop/src/renderer/App.tsx`
Update sign-in screen to use new design tokens (spinner, buttons). Remove dead `pageTitle` prop from AppShell.

### `apps/desktop/src/renderer/LibraryView.tsx`
Fix broken `CaptureGrid` API (flat → groups), add `SearchGateway`, add `groupCapturesByDate` helper, use new token classes.

---

## Verification

1. `pnpm install` — `@synthesis/styles` resolves
2. `pnpm dev:web` — no visual regression
3. `pnpm dev:desktop` — warm cream theme, sidebar with orange pill, Fraunces search, card shadows, grain overlay
4. Edit a token in `packages/styles/src/globals.css` → both apps reflect the change
5. `grep -r "@theme" packages/ apps/` → only found in `packages/styles/src/globals.css`

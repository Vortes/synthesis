#!/bin/bash
# Re-sign the development Electron.app with the Apple Development certificate
# so that macOS TCC (Accessibility permissions) persists across runs.
#
# Why: The Electron binary in node_modules is ad-hoc signed, which means
# macOS TCC cannot reliably track permission grants. Signing with a real
# certificate gives TCC a stable identity to anchor permissions to.

ELECTRON_APP="$(dirname "$0")/../../../node_modules/electron/dist/Electron.app"
IDENTITY="Apple Development"

if [ ! -d "$ELECTRON_APP" ]; then
  echo "[sign-electron-dev] Electron.app not found — skipping"
  exit 0
fi

# Check if a valid signing identity exists
if ! security find-identity -v -p codesigning 2>/dev/null | grep -q "Apple Development"; then
  echo "[sign-electron-dev] No Apple Development certificate found — skipping"
  exit 0
fi

echo "[sign-electron-dev] Signing Electron.app..."
codesign --force --deep --sign "$IDENTITY" "$ELECTRON_APP" 2>&1
echo "[sign-electron-dev] Done"

import dotenv from "dotenv";
import type { ForgeConfig } from "@electron-forge/shared-types";

// Determine app environment (default: development for local dev)
const APP_ENV = process.env.APP_ENV || "development";

// Load base .env, then override with environment-specific file
dotenv.config({ path: ".env" });
dotenv.config({ path: `.env.${APP_ENV}`, override: true });

console.log(`[forge] APP_ENV=${APP_ENV}`);
console.log(`[forge] VITE_WEB_URL=${process.env.VITE_WEB_URL}`);
console.log(`[forge] APPLE_ID=${process.env.APPLE_ID ? "***loaded***" : "MISSING"}`);
import { MakerZIP } from "@electron-forge/maker-zip";
import { MakerDMG } from "@electron-forge/maker-dmg";
import { VitePlugin } from "@electron-forge/plugin-vite";

const config: ForgeConfig = {
  packagerConfig: {
    name: "Curate",
    appBundleId: "is.curate.desktop",
    asar: true,
    extraResource: [
      "./native/build/Release/ax_url_reader.node",
      "./swift-helpers/window-info",
    ],
    protocols: [
      {
        name: "Curate",
        schemes: [process.env.APP_PROTOCOL!],
      },
    ],
    osxSign: {},
    osxNotarize: {
      appleId: process.env.APPLE_ID!,
      appleIdPassword: process.env.APPLE_PASSWORD!,
      teamId: "LUBHD22X5N",
    },
  },
  makers: [new MakerZIP({}, ["darwin"]), new MakerDMG({
      format: "ULFO",
      contents: (opts) => [
        { x: 180, y: 170, type: "file", path: opts.appPath },
        { x: 480, y: 170, type: "link", path: "/Applications" },
      ],
      additionalDMGOptions: {
        window: {
          size: { width: 660, height: 400 },
        },
      },
    })],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: "src/main.ts",
          config: "vite.main.config.ts",
          target: "main",
        },
        {
          entry: "src/preload.ts",
          config: "vite.preload.config.ts",
          target: "preload",
        },
        {
          entry: "src/capture/overlay-preload.ts",
          config: "vite.preload.config.ts",
          target: "preload",
        },
      ],
      renderer: [
        {
          name: "main_window",
          config: "vite.renderer.config.ts",
        },
      ],
    }),
  ],
};

export default config;

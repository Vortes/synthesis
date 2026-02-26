import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

const APP_ENV = process.env.APP_ENV || undefined;
const isProduction = APP_ENV !== undefined && APP_ENV !== "development";

export default defineConfig({
  mode: APP_ENV,
  plugins: [react(), tailwindcss()],
  envDir: path.resolve(__dirname),
  define: {
    ...(isProduction && {
      "process.env.NODE_ENV": JSON.stringify("production"),
    }),
  },
  optimizeDeps: {
    exclude: ["@curate/ui", "@curate/styles"],
  },
});

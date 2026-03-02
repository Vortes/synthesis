import { defineConfig } from "vite";

export default defineConfig(() => ({
  define: {
    "process.env.VITE_WEB_URL": JSON.stringify(
      process.env.VITE_WEB_URL || "http://localhost:3000"
    ),
    "process.env.CLERK_OAUTH_CLIENT_ID": JSON.stringify(
      process.env.CLERK_OAUTH_CLIENT_ID ?? ""
    ),
    "process.env.CLERK_DOMAIN": JSON.stringify(
      process.env.CLERK_DOMAIN || "https://clerk.curate.is"
    ),
  },
}));

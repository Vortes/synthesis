import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { App } from "./App";
import "./index.css";

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

const root = createRoot(document.getElementById("root")!);

if (!CLERK_PUBLISHABLE_KEY) {
  root.render(
    <div style={{ color: "#1c1b19", padding: 32, fontFamily: "system-ui" }}>
      <h1>Missing Clerk key</h1>
      <p>Add <code>VITE_CLERK_PUBLISHABLE_KEY</code> to <code>apps/desktop/.env</code></p>
    </div>
  );
} else {
  root.render(
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <App />
    </ClerkProvider>
  );
}

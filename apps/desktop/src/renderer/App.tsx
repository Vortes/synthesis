import { AppShell } from "@curate/ui";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useAuth } from "./AuthProvider";
import { TRPCProvider } from "./TRPCProvider";
import { LibraryView } from "./LibraryView";

function SignInScreen() {
  const { signIn } = useAuth();
  const [status, setStatus] = useState<"idle" | "waiting">("idle");

  const handleSignIn = useCallback(() => {
    signIn();
    setStatus("waiting");
  }, [signIn]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Curate</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to access your design library
        </p>
      </div>

      {status === "idle" && (
        <button
          onClick={handleSignIn}
          className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90"
        >
          Sign in with browser
        </button>
      )}

      {status === "waiting" && (
        <div className="flex flex-col items-center gap-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-ink-whisper border-t-orange" />
          <p className="text-sm text-muted-foreground">
            Waiting for sign-in...
          </p>
        </div>
      )}
    </div>
  );
}

function AppContent() {
  const { signOut, isSigningOut } = useAuth();
  const queryClient = useQueryClient();

  const handleSignOut = useCallback(async () => {
    queryClient.clear();
    await signOut();
  }, [signOut, queryClient]);

  return (
    <AppShell
      activePath="/library"
      platform="desktop"
      onSignOut={handleSignOut}
      isSigningOut={isSigningOut}
    >
      <LibraryView />
    </AppShell>
  );
}

export function App() {
  const { isLoading, isSignedIn } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-ink-whisper border-t-orange" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <SignInScreen />;
  }

  return (
    <TRPCProvider>
      <AppContent />
    </TRPCProvider>
  );
}

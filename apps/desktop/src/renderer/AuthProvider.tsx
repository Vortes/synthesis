import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface AuthContextValue {
  token: string | null;
  isLoading: boolean;
  isSignedIn: boolean;
  isSigningOut: boolean;
  signIn: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  token: null,
  isLoading: true,
  isSignedIn: false,
  isSigningOut: false,
  signIn: () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    // Load persisted token on mount
    window.electronAPI.getToken().then((t) => {
      setToken(t);
      setIsLoading(false);
    });

    // Listen for fresh tokens from deep-link exchange
    const cleanup = window.electronAPI.onAuthToken((newToken) => {
      setToken(newToken);
      setIsLoading(false);
    });

    return cleanup;
  }, []);

  const signIn = useCallback(() => {
    window.electronAPI.signIn();
  }, []);

  const signOut = useCallback(async () => {
    setIsSigningOut(true);
    try {
      await window.electronAPI.signOut();
      setToken(null);
    } finally {
      setIsSigningOut(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ token, isLoading, isSignedIn: !!token, isSigningOut, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

import { createContext, useContext, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest } from "@/app/lib/api";
import type {
  BiometricLoginCredentials,
  LoginCredentials,
  TokenResponse,
} from "@/app/types/auth";

interface AuthSession {
  token: string;
  refresh_token?: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
}

interface AuthContextValue {
  session: AuthSession | null;
  token: string | null;
  user: AuthSession["user"] | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthSession>;
  biometricLogin: (
    credentials: BiometricLoginCredentials,
  ) => Promise<AuthSession>;
  logout: () => void;
  loginPending: boolean;
  biometricLoginPending: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

  const SESSION_QUERY_KEY = ["auth", "session"] as const;
  
  // Simple session storage functions
  const SESSION_KEY = 'fra_session';

  function getStoredSession(): AuthSession | null {
    try {
      const session = localStorage.getItem(SESSION_KEY);
      return session ? JSON.parse(session) : null;
    } catch {
      return null;
    }
  }

  function storeSession(session: AuthSession) {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('Failed to store session:', error);
    }
  }

  function clearStoredSession() {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }
  
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const sessionQuery = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: getStoredSession,
    staleTime: Infinity,
  });

  const setSession = (session: AuthSession) => {
    storeSession(session);
    queryClient.setQueryData(SESSION_QUERY_KEY, session);
  };
 
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await apiRequest<TokenResponse>(`/auth/token`, {
        method: "POST",
        body: credentials,
        isFormData: true,
      });
      
      // Transform token response to session format
      const session = {
        token: response.access_token,
        refresh_token: response.refresh_token,
        user: {
          id: "",
          name: credentials.username,
          role: "USER", // Default role - backend will validate permissions
        },
      };
      return session;
    },
    onSuccess: setSession,
  });

  const biometricLoginMutation = useMutation({
    mutationFn: (credentials: BiometricLoginCredentials) =>
      apiRequest<AuthSession>(`/auth/biometric-login`, {
        method: "POST",
        body: credentials,
      }),
    onSuccess: setSession,
  });

  const logout = () => {
    clearStoredSession();
    queryClient.setQueryData(SESSION_QUERY_KEY, null);
    queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== "auth" });
  };

  const session = sessionQuery.data ?? null;

  
  return (
    <AuthContext.Provider
      value={{
        session,
        token: session?.token ?? null,
        user: session?.user ?? null,
        isAuthenticated: Boolean(session?.token),
        isLoading: sessionQuery.isLoading,
        login: loginMutation.mutateAsync,
        biometricLogin: biometricLoginMutation.mutateAsync,
        logout,
        loginPending: loginMutation.isPending,
        biometricLoginPending: biometricLoginMutation.isPending,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}

import { createContext, useContext, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest } from "@/app/lib/api";
import type {
  AuthSession,
  BiometricLoginCredentials,
  LoginCredentials,
} from "@/app/types/auth";
import {
  clearStoredSession,
  getStoredSession,
  storeSession,
} from "./authStorage";

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
    mutationFn: (credentials: LoginCredentials) =>
      apiRequest<AuthSession>("/auth/login", {
        method: "POST",
        body: credentials,
      }),
    onSuccess: setSession,
  });

  const biometricLoginMutation = useMutation({
    mutationFn: (credentials: BiometricLoginCredentials) =>
      apiRequest<AuthSession>("/auth/biometric-login", {
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

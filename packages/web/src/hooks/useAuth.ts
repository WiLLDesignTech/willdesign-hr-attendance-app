import { useState, useCallback, createContext, useContext } from "react";
import type { ReactNode } from "react";
import React from "react";
import { ROLE_PERMISSIONS } from "@hr-attendance-app/types";

interface AuthState {
  readonly token: string | null;
  readonly employeeId: string | null;
  readonly role: string | null;
  readonly permissions: readonly string[];
  readonly isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (token: string, employeeId: string, role: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // JWT stored in memory only — not localStorage (XSS protection)
  const [auth, setAuth] = useState<AuthState>({
    token: null,
    employeeId: null,
    role: null,
    permissions: [],
    isAuthenticated: false,
  });

  const login = useCallback((token: string, employeeId: string, role: string) => {
    const rolePermissions = ROLE_PERMISSIONS[role] ?? [];
    setAuth({ token, employeeId, role, permissions: rolePermissions, isAuthenticated: true });
  }, []);

  const logout = useCallback(() => {
    setAuth({ token: null, employeeId: null, role: null, permissions: [], isAuthenticated: false });
  }, []);

  return React.createElement(AuthContext.Provider, { value: { ...auth, login, logout } }, children);
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

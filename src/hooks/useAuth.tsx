"use client";
 
/* eslint-disable react-hooks/set-state-in-effect */
 


import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { AuthUser, UserRole } from "@/lib/db/types";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const DEMO_CREDENTIALS: { email: string; password: string; role: UserRole }[] = [
  { email: "admin@ftth.ma", password: "admin123", role: "admin" },
  { email: "tech@ftth.ma", password: "tech123", role: "technician" },
];

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => ({ success: false }),
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("auth_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("auth_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const match = DEMO_CREDENTIALS.find((c) => c.email === email && c.password === password);
    if (!match) {
      return { success: false, error: "Email ou mot de passe incorrect." };
    }
    const authUser: AuthUser = { email: match.email, role: match.role };
    localStorage.setItem("auth_user", JSON.stringify(authUser));
    setUser(authUser);
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("auth_user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

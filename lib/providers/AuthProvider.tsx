'use client';

import * as React from 'react';
import { api } from '@/lib/api';

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface AuthUser {
  id:        string;
  name:      string;
  email:     string;
  createdAt: string;
  role: 'customer' | 'vendor' | 'admin';
}

export interface AuthError {
  field?: 'email' | 'password' | 'name' | 'confirmPassword' | 'general';
  message: string;
}

interface AuthContextValue {
  user:       AuthUser | null;
  isLoggedIn: boolean;
  isLoading:  boolean;
  login:      (email: string, password: string) => Promise<AuthError | null>;
  register:   (name: string, email: string, password: string) => Promise<AuthError | null>;
  logout:     () => void;
}

// ─── Context ───────────────────────────────────────────────────────────────────
const AuthContext = React.createContext<AuthContextValue | null>(null);

const STORAGE_KEY  = 'electrohub_user';
const MOCK_DB_KEY  = 'electrohub_mock_users';

// ─── Mock user database helpers ───────────────────────────────────────────────
interface MockUser {
  id:           string;
  name:         string;
  email:        string;
  passwordHash: string;   // In mock, we just store the password directly
  createdAt:    string;
}

function getMockUsers(): MockUser[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(MOCK_DB_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveMockUsers(users: MockUser[]) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(MOCK_DB_KEY, JSON.stringify(users)); } catch { /* ignore */ }
}

function loadCurrentUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed ? { ...parsed, role: parsed.role ?? 'customer' } : null;
  } catch { return null; }
}

function persistCurrentUser(user: AuthUser | null) {
  if (typeof window === 'undefined') return;
  try {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else       localStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
}

// ─── Tiny deterministic ID ─────────────────────────────────────────────────────
function generateId() {
  return `usr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,      setUser]      = React.useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hydrated,  setHydrated]  = React.useState(false);

  // Hydrate from localStorage on mount
  React.useEffect(() => {
    setUser(loadCurrentUser());
    setHydrated(true);
  }, []);

  // ── login ──────────────────────────────────────────────────────────────────
  const login = React.useCallback(
    async (email: string, password: string): Promise<AuthError | null> => {
      setIsLoading(true);
      try {
        const response = await api.post<{ access: string; refresh: string; user: { id: number; name: string; email: string; role: AuthUser['role'] } }>('/login/', { email, password });
        localStorage.setItem('electrohub_access_token', response.access);
        localStorage.setItem('electrohub_refresh_token', response.refresh);
        const authUser: AuthUser = { id: String(response.user.id), name: response.user.name, email: response.user.email, createdAt: new Date().toISOString(), role: response.user.role };
        setUser(authUser);
        persistCurrentUser(authUser);
        setIsLoading(false);
        return null;
      } catch {
        await new Promise<void>((res) => setTimeout(res, 400));
      }

      const users = getMockUsers();
      const found = users.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.passwordHash === password,
      );

      setIsLoading(false);

      if (!found) {
        return { field: 'general', message: 'Invalid email or password. Please try again.' };
      }

      const authUser: AuthUser = {
        id:        found.id,
        name:      found.name,
        email:     found.email,
        createdAt: found.createdAt,
        role: 'customer',
      };
      setUser(authUser);
      persistCurrentUser(authUser);
      return null;
    },
    [],
  );

  // ── register ───────────────────────────────────────────────────────────────
  const register = React.useCallback(
    async (name: string, email: string, password: string): Promise<AuthError | null> => {
      setIsLoading(true);
      await new Promise<void>((res) => setTimeout(res, 900));

      const users = getMockUsers();
      const exists = users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase());

      if (exists) {
        setIsLoading(false);
        return { field: 'email', message: 'An account with this email already exists.' };
      }

      const newUser: MockUser = {
        id:           generateId(),
        name:         name.trim(),
        email:        email.trim().toLowerCase(),
        passwordHash: password,
        createdAt:    new Date().toISOString(),
      };
      saveMockUsers([...users, newUser]);

      const authUser: AuthUser = {
        id:        newUser.id,
        name:      newUser.name,
        email:     newUser.email,
        createdAt: newUser.createdAt,
        role: 'customer',
      };
      setUser(authUser);
      persistCurrentUser(authUser);
      setIsLoading(false);
      return null;
    },
    [],
  );

  // ── logout ─────────────────────────────────────────────────────────────────
  const logout = React.useCallback(() => {
    setUser(null);
    persistCurrentUser(null);
  }, []);

  // Don't render children until we've hydrated (prevents SSR mismatch)
  if (!hydrated) return null;

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

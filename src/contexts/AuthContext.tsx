"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type {
  User,
  SignupPayload,
  LoginPayload,
  AuthResponse,
  GoogleLoginOptions,
  TelegramAuthPayload,
} from "@/services/auth.service";
import {
  getMe,
  signup as apiSignup,
  login as apiLogin,
  googleLogin as apiGoogleLogin,
  telegramLogin as apiTelegramLogin,
  telegramWebAppLogin as apiTelegramWebAppLogin,
  logout as apiLogout,
} from "@/services/auth.service";


interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signup: (payload: SignupPayload) => Promise<AuthResponse>;
  login: (payload: LoginPayload) => Promise<AuthResponse>;
  googleLogin: (credential: string, opts?: GoogleLoginOptions) => Promise<AuthResponse>;
  telegramLogin: (payload: TelegramAuthPayload) => Promise<AuthResponse>;
  telegramWebAppLogin: (initData: string) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  /** Reload user from GET /api/me (e.g. after profile update). */
  refreshUser: () => Promise<void>;
  error: string | null;
  clearError: () => void;
  googleClientId: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children, googleClientId }: { children: React.ReactNode; googleClientId?: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUser = useCallback(async () => {
    try {
      const data = await getMe();
      if (data) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const signup = useCallback(async (payload: SignupPayload) => {
    setError(null);
    try {
      const data = await apiSignup(payload);
      setUser(data.user);
      return data;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Signup failed";
      setError(message);
      throw e;
    }
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    setError(null);
    try {
      const data = await apiLogin(payload);
      setUser(data.user);
      return data;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Login failed";
      setError(message);
      throw e;
    }
  }, []);

  const googleLogin = useCallback(async (credential: string, opts?: GoogleLoginOptions) => {
    setError(null);
    try {
      const data = await apiGoogleLogin(credential, opts);
      setUser(data.user);
      return data;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Google login failed";
      setError(message);
      throw e;
    }
  }, []);

  const telegramLogin = useCallback(async (payload: TelegramAuthPayload) => {
    setError(null);
    try {
      const data = await apiTelegramLogin(payload);
      setUser(data.user);
      return data;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Telegram login failed";
      setError(message);
      throw e;
    }
  }, []);

  const telegramWebAppLogin = useCallback(async (initData: string) => {
    setError(null);
    try {
      const data = await apiTelegramWebAppLogin(initData);
      setUser(data.user);
      return data;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Telegram login failed";
      setError(message);
      throw e;
    }
  }, []);

  const logout = useCallback(async () => {
    setError(null);
    try {
      await apiLogout();
    } finally {
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await getMe();
      if (data?.user) {
        setUser(data.user);
      }
    } catch {
      setUser(null);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value: AuthContextValue = {
    user,
    loading,
    signup,
    login,
    googleLogin,
    telegramLogin,
    telegramWebAppLogin,
    logout,
    refreshUser,
    error,
    clearError,
    googleClientId:
      googleClientId ||
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
      "510278494876-bkmbkv9hfuelp0a5pv8lcqpd32ondgst.apps.googleusercontent.com",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

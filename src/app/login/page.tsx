"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getCsrfToken } from "@/lib/api";
import { Eye, EyeOff } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { AuthSplitShell } from "@/components/auth/AuthSplitShell";
import { PhonePrefixInput } from "@/components/auth/PhonePrefixInput";
import { TelegramLoginButton } from "@/components/auth/TelegramLoginButton";
import { useLanguage } from "@/contexts/LanguageContext";
import { isInsideTelegram } from "@/lib/telegram-webapp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const REMEMBER_PHONE_KEY = "carra_login_phone_local";

function GoogleLoginSection() {
  const { googleLogin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get("redirect") || "/";

  const handleGoogleSuccess = async (credentialResponse: {
    credential?: string;
  }) => {
    try {
      await googleLogin(credentialResponse.credential!);
      router.push(redirect);
    } catch {
      // AuthContext
    }
  };

  return (
    <div className="flex w-full justify-center [&>div]:flex [&>div]:w-full [&>div]:justify-center">
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={() => console.error("Google Login Failed")}
        theme="outline"
        size="large"
        shape="pill"
        logo_alignment="center"
        text="continue_with"
      />
    </div>
  );
}

function TelegramLoginSection() {
  const { telegramLogin, telegramWebAppLogin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get("redirect") || "/";

  return (
    <TelegramLoginButton
      onAuth={async (payload) => {
        await telegramLogin(payload);
        router.replace(redirect);
      }}
      onWebAppAuth={async (initData) => {
        await telegramWebAppLogin(initData);
        router.replace(redirect);
      }}
    />
  );
}

function LoginForm() {
  const { user, loading: authLoading, login, error, clearError, googleClientId } =
    useAuth();
  const { dict } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get("redirect") || "/";

  const [phone, setPhone] = useState("");
  const [useEmail, setUseEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const passwordResetDone = searchParams?.get("reset") === "success";

  useEffect(() => {
    if (!authLoading && user) router.replace(redirect);
  }, [user, authLoading, router, redirect]);

  useEffect(() => {
    getCsrfToken().catch(() => {});
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(REMEMBER_PHONE_KEY);
      if (raw && !raw.includes("@")) setPhone(raw);
    } catch {
      /* ignore */
    }
  }, []);

  const persistRememberPhone = () => {
    try {
      if (rememberMe && !useEmail)
        localStorage.setItem(REMEMBER_PHONE_KEY, phone.trim());
      else localStorage.removeItem(REMEMBER_PHONE_KEY);
    } catch {
      /* ignore */
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSubmitting(true);
    const identifier = useEmail ? email.trim() : phone.trim();
    try {
      await login({ identifier, password });
      persistRememberPhone();
      router.push(redirect);
    } catch {
      /* AuthContext */
    } finally {
      setSubmitting(false);
    }
  };

  const isLoading = authLoading || submitting;

  if (authLoading || (isInsideTelegram() && !user)) {
    return (
      <AuthSplitShell>
        <div className="flex min-h-[40vh] flex-col items-center justify-center p-6 text-center lg:min-h-[50vh]">
          <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#24A1DE] border-t-transparent" />
          <p className="text-base font-bold text-slate-900">
            Authenticating with Telegram…
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Accessing marketplace…
          </p>
        </div>
      </AuthSplitShell>
    );
  }

  const linkClass =
    "font-semibold text-brand-blue underline-offset-2 hover:text-blue-600 hover:underline";

  return (
    <AuthSplitShell>
      <header className="mb-3">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl sm:leading-tight">
          {dict.auth.welcomeBack}
        </h1>
        <p className="mt-1 max-w-md text-sm leading-snug text-slate-600">
          {dict.auth.welcomeBackSubtitle}
        </p>
      </header>

      {passwordResetDone && (
        <div
          role="status"
          className="mb-3 rounded-lg border border-emerald-200/80 bg-emerald-50/90 px-3 py-2 text-sm text-emerald-900"
        >
          {dict.auth.passwordResetSuccess}
        </div>
      )}

      {error && (
        <div className="mb-3 flex items-start justify-between gap-2 rounded-lg border border-red-200 bg-red-50/95 px-3 py-2 text-sm text-red-800">
          <span className="min-w-0">{error}</span>
          <button
            type="button"
            onClick={clearError}
            className="shrink-0 text-xs font-semibold uppercase tracking-wide text-red-600 hover:text-red-800"
          >
            {dict.auth.dismiss}
          </button>
        </div>
      )}

      <div className="mb-6 mt-2 space-y-3">
        {googleClientId ? <GoogleLoginSection /> : null}
        <TelegramLoginSection />
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs font-medium">
          <span className="bg-slate-50 px-3 uppercase tracking-widest text-slate-400">
            {dict.auth.phoneOrEmail}
          </span>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200/90 bg-white px-4 py-4 shadow-sm sm:px-5 sm:py-4"
      >
        <div className="space-y-3.5 sm:space-y-4">
          <div>
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <label
                htmlFor="login-phone"
                className="text-sm font-semibold text-slate-800"
              >
                {useEmail ? dict.auth.emailLabel : dict.auth.phoneLabel}
              </label>
              <button
                type="button"
                onClick={() => {
                  setUseEmail(!useEmail);
                  clearError();
                }}
                className="text-xs font-medium text-brand-blue hover:text-blue-600"
              >
                {useEmail ? dict.auth.usePhone : dict.auth.useEmail}
              </button>
            </div>
            {!useEmail ? (
              <PhonePrefixInput
                id="login-phone"
                value={phone}
                onChange={setPhone}
                required
                aria-invalid={Boolean(error)}
              />
            ) : (
              <Input
                id="login-email"
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            )}
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="mb-1.5 block text-sm font-semibold text-slate-800"
            >
              {dict.auth.passwordLabel}
            </label>
            <div className="relative">
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-11"
                placeholder={dict.auth.passwordLabel}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="size-4 shrink-0 rounded border-slate-300 bg-white text-brand-blue focus:ring-2 focus:ring-brand-blue/35 focus:ring-offset-0"
                style={{ accentColor: "var(--brand-blue)" }}
              />
              {dict.auth.rememberMe}
            </label>
            <Link
              href={
                redirect !== "/"
                  ? `/forgot-password?redirect=${encodeURIComponent(redirect)}`
                  : "/forgot-password"
              }
              className={`text-sm ${linkClass}`}
            >
              {dict.auth.forgotPassword}
            </Link>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="h-12 w-full text-sm font-bold shadow-sm"
          >
            {submitting ? dict.auth.loggingIn : dict.auth.loginBtn}
          </Button>
        </div>
      </form>

      <p className="mt-4 text-center text-sm text-slate-600">
        {dict.auth.dontHaveAccount}{" "}
        <Link
          href={
            redirect !== "/"
              ? `/signup?redirect=${encodeURIComponent(redirect)}`
              : "/signup"
          }
          className={linkClass}
        >
          {dict.auth.signupTitle}
        </Link>
      </p>

      <p className="mt-4 text-center text-xs leading-relaxed text-slate-500">
        <Link href="/terms" className={linkClass}>
          {dict.auth.terms}
        </Link>
        <span className="mx-2 text-slate-300" aria-hidden>
          ·
        </span>
        <Link href="/privacy" className={linkClass}>
          {dict.auth.privacy}
        </Link>
      </p>
    </AuthSplitShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthSplitShell>
          <div className="flex min-h-[40vh] items-center justify-center lg:min-h-[50vh]">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-blue border-t-transparent" />
          </div>
        </AuthSplitShell>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

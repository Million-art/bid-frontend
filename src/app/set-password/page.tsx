"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { AuthSplitShell } from "@/components/auth/AuthSplitShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/api";
import { validatePasswordPolicy } from "@/lib/passwordPolicy";
import { setPasswordWithToken } from "@/services/auth.service";

function SetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token")?.trim() || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("This invite link is missing a token. Request a new invite.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError("Missing invite token.");
      return;
    }
    const policyError = validatePasswordPolicy(password);
    if (policyError) {
      setError(policyError);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await setPasswordWithToken(token, password);
      setDone(true);
      window.setTimeout(() => {
        router.replace("/staffpanel");
      }, 1500);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthSplitShell>
      <div className="mx-auto w-full max-w-md px-4 py-10 sm:px-0">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--brand-blue)]">
          Staff access
        </p>
        <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
          Set your password
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Choose a password to finish your CarraMarket staff invite, then sign
          in on the staff panel.
        </p>

        {done ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-5 text-sm font-semibold text-emerald-900">
            Password saved. Redirecting you to the staff panel…
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {error}
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-800">
                New password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={4}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-800">
                Confirm password
              </label>
              <Input
                type={showPassword ? "text" : "password"}
                required
                minLength={4}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <Button
              type="submit"
              disabled={submitting || !token}
              className="h-11 w-full rounded-xl bg-[var(--brand-blue)] font-bold text-white"
            >
              {submitting ? "Saving…" : "Save password"}
            </Button>
            <p className="text-center text-sm text-slate-500">
              Already set up?{" "}
              <Link
                href="/staffpanel"
                className="font-bold text-[var(--brand-blue)] hover:underline"
              >
                Go to staff panel
              </Link>
            </p>
          </form>
        )}
      </div>
    </AuthSplitShell>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthSplitShell>
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-blue border-t-transparent" />
          </div>
        </AuthSplitShell>
      }
    >
      <SetPasswordForm />
    </Suspense>
  );
}

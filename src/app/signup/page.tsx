"use client";

import React, { useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { sendOtp, verifyOtp } from "@/services/auth.service";
import { Eye, EyeOff } from "lucide-react";
import { validatePasswordPolicy } from "@/lib/passwordPolicy";
import { ApiError, getErrorMessage, getCsrfToken } from "@/lib/api";

import { AuthSplitShell } from "@/components/auth/AuthSplitShell";
import { PhonePrefixInput } from "@/components/auth/PhonePrefixInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function SignupForm() {
  const { user, loading: authLoading, signup, error, clearError } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get("redirect") || "/";

  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [flowError, setFlowError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const alertRef = useRef<HTMLDivElement>(null);

  const normalizedPhone = phone.trim();

  useEffect(() => {
    if (!authLoading && user) router.replace(redirect);
  }, [user, authLoading, router, redirect]);

  useEffect(() => {
    getCsrfToken().catch(() => { });
  }, []);

  const combinedError = error || flowError;
  useEffect(() => {
    if (combinedError && alertRef.current) {
      alertRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [combinedError]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setFlowError(null);
    const trimmedName = fullName.trim();
    if (!normalizedPhone || !trimmedName) return;
    if (!acceptedTerms) {
      setFlowError("Please accept the Terms and Privacy Policy first.");
      return;
    }
    if (password !== confirmPassword) return;
    if (validatePasswordPolicy(password)) return;
    setSendingCode(true);
    try {
      await sendOtp(normalizedPhone);
      setStep(2);
      setOtpCode("");
    } catch (err) {
      const msg = getErrorMessage(err);
      if (err instanceof ApiError && err.status === 409) {
        setFlowError(`${msg} If this is your number, sign in instead.`);
      } else {
        setFlowError(msg);
      }
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyAndSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setFlowError(null);
    if (!otpCode.trim() || otpCode.replace(/\D/g, "").length !== 6) return;
    if (!acceptedTerms) {
      setFlowError("Please accept the Terms and Privacy Policy first.");
      return;
    }
    if (!fullName.trim() || password !== confirmPassword || validatePasswordPolicy(password)) {
      setStep(1);
      return;
    }
    setSubmitting(true);
    try {
      const { verificationToken } = await verifyOtp(normalizedPhone, otpCode.trim());
      try {
        await signup({
          phone: normalizedPhone,
          fullName: fullName.trim(),
          password,
          confirmPassword,
          verificationToken,
          acceptTerms: true,
        });
        router.push(redirect);
      } catch {
        /* context */
      }
    } catch (err) {
      setFlowError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (step === 1) void handleSendCode(e);
    else void handleVerifyAndSignup(e);
  };

  const isLoading = authLoading || submitting || sendingCode;
  const passwordPolicyError = password ? validatePasswordPolicy(password) : null;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const linkClass = "font-semibold text-brand-blue hover:text-blue-600 underline-offset-2 hover:underline";

  if (authLoading) {
    return (
      <AuthSplitShell>
        <div className="flex min-h-[40vh] items-center justify-center lg:min-h-[50vh]">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-blue border-t-transparent" />
        </div>
      </AuthSplitShell>
    );
  }

  return (
    <AuthSplitShell>
      <header className="mb-3">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl sm:leading-tight">
          {"Create your account"}
        </h1>
        <p className="mt-1 text-sm leading-snug text-slate-600">
          {step === 1 ? "" : "Enter the code we sent to finish."}
        </p>
      </header>

      {combinedError && (
        <div
          ref={alertRef}
          role="alert"
          className="mb-3 flex items-start justify-between gap-2 rounded-lg border border-red-200 bg-red-50/95 px-3 py-2 text-sm text-red-800"
        >
          <span className="min-w-0">{combinedError}</span>
          <button
            type="button"
            onClick={() => {
              clearError();
              setFlowError(null);
            }}
            className="shrink-0 text-[0.65rem] font-semibold uppercase tracking-wide text-red-600 hover:text-red-800"
          >{"Dismiss"}</button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
        <label className="flex cursor-pointer gap-2.5 px-3 py-2.5 sm:px-4">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 rounded border-slate-300 bg-white text-brand-blue focus:ring-2 focus:ring-brand-blue/35 focus:ring-offset-0"
            style={{ accentColor: "var(--brand-blue)" }}
          />
          <span className="text-xs leading-snug text-slate-600 sm:text-[0.8125rem]">
            I agree to the{" "}
            <Link href="/terms" target="_blank" rel="noopener noreferrer" className={linkClass}>
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" target="_blank" rel="noopener noreferrer" className={linkClass}>
              Privacy Policy
            </Link>
            .
          </span>
        </label>

        <form onSubmit={handleSubmit} className="border-t border-slate-100 px-3 py-3 sm:px-4 sm:py-4">
          {step === 1 ? (
            <div className="space-y-3.5 sm:space-y-4">
              <div>
                <label htmlFor="signup-phone" className="mb-1.5 block text-sm font-semibold text-slate-800">{"Phone number"}</label>
                <PhonePrefixInput
                  id="signup-phone"
                  value={phone}
                  onChange={setPhone}
                  aria-invalid={Boolean(step === 1 && flowError)}
                  required
                />
                <p className="mt-1 text-[0.7rem] text-slate-500">{"SMS code · rates may apply"}</p>
              </div>

              <div>
                <label htmlFor="signup-name" className="mb-1.5 block text-sm font-semibold text-slate-800">{"Full name"}</label>
                <Input
                  id="signup-name"
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={"Your full name"}
                  required
                />
              </div>

              <div>
                <label htmlFor="signup-password" className="mb-1.5 block text-sm font-semibold text-slate-800">{"Password"}</label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-11"
                    placeholder={"4+ chars"}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {passwordPolicyError && <p className="mt-1 text-xs text-amber-800">{passwordPolicyError}</p>}
              </div>

              <div>
                <label htmlFor="signup-confirm" className="mb-1.5 block text-sm font-semibold text-slate-800">{"Confirm password"}</label>
                <div className="relative">
                  <Input
                    id="signup-confirm"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pr-11"
                    placeholder={"Re-enter password"}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {passwordsMismatch && <p className="mt-1 text-xs text-red-600">{"Passwords don’t match."}</p>}
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                {"Code sent to"} <span className="font-semibold text-slate-900">{normalizedPhone || phone}</span>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    clearError();
                    setFlowError(null);
                  }}
                  className={`ml-2 ${linkClass}`}
                >{"Change number"}</button>
              </p>

              <div>
                <label htmlFor="signup-otp" className="mb-1.5 block text-sm font-semibold text-slate-800">{"Verification code"}</label>
                <Input
                  id="signup-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  className="text-center text-lg tracking-[0.35em]"
                  placeholder="••••••"
                  required
                />
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={
              isLoading ||
              !acceptedTerms ||
              (step === 1
                ? !normalizedPhone ||
                !fullName.trim() ||
                !!validatePasswordPolicy(password) ||
                password !== confirmPassword
                : otpCode.replace(/\D/g, "").length !== 6)
            }
            className="mt-4 w-full h-12 text-sm font-bold shadow-sm"
          >
            {step === 1 ? (sendingCode ? "Sending code…" : "Send verification code") : submitting ? "Creating account…" : "Create account"}
          </Button>
        </form>
      </div>

      <p className="mt-4 text-center text-sm text-slate-600">
        {"Already joined?"}{" "}
        <Link href={redirect !== "/" ? `/login?redirect=${encodeURIComponent(redirect)}` : "/login"} className={linkClass}>{"Log in"}</Link>
      </p>
    </AuthSplitShell>
  );
}

export default function SignupPage() {
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
      <SignupForm />
    </Suspense>
  );
}

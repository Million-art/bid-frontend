"use client";

import React, { useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthSplitShell } from "@/components/auth/AuthSplitShell";
import { PhonePrefixInput } from "@/components/auth/PhonePrefixInput";

import {
  forgotPasswordSendOtp,
  forgotPasswordVerifyOtp,
  forgotPasswordReset,
} from "@/services/auth.service";
import { Eye, EyeOff } from "lucide-react";
import { validatePasswordPolicy } from "@/lib/passwordPolicy";
import { ApiError, getErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function ForgotPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get("redirect") || "/";

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [flowError, setFlowError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  const combinedAlert = flowError || infoMessage;
  const normalizedPhone = phone.trim();
  useEffect(() => {
    if (combinedAlert && alertRef.current) {
      alertRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [combinedAlert]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setFlowError(null);
    setInfoMessage(null);
    if (!normalizedPhone) return;
    setSendingCode(true);
    try {
      await forgotPasswordSendOtp(normalizedPhone);
      setInfoMessage(
        "We sent a verification code to your phone."
      );
      setStep(2);
      setOtpCode("");
    } catch (err) {
      setFlowError(getErrorMessage(err));
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setFlowError(null);
    setInfoMessage(null);
    if (otpCode.replace(/\D/g, "").length !== 6) return;
    setSubmitting(true);
    try {
      const { resetToken: token } = await forgotPasswordVerifyOtp(normalizedPhone, otpCode.trim());
      setResetToken(token);
      setStep(3);
      setInfoMessage("Choose a new password.");
    } catch (err) {
      setFlowError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFlowError(null);
    setInfoMessage(null);
    if (newPassword !== confirmPassword) {
      setFlowError("Passwords do not match.");
      return;
    }
    const policyErr = validatePasswordPolicy(newPassword);
    if (policyErr) {
      setFlowError(policyErr);
      return;
    }
    setSubmitting(true);
    try {
      await forgotPasswordReset({
        phone: normalizedPhone,
        resetToken,
        newPassword,
        confirmPassword,
      });
      const q = redirect !== "/" ? `?redirect=${encodeURIComponent(redirect)}&reset=success` : "?reset=success";
      router.push(`/login${q}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setFlowError(`${getErrorMessage(err)} Start over from step 1.`);
        setStep(1);
        setResetToken("");
        setOtpCode("");
      } else {
        setFlowError(getErrorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (step === 1) void handleSendCode(e);
    else if (step === 2) void handleVerifyCode(e);
    else void handleResetPassword(e);
  };

  const isLoading = sendingCode || submitting;
  const passwordPolicyError = newPassword ? validatePasswordPolicy(newPassword) : null;
  const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  return (
    <AuthSplitShell>
      <div className="w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{"Reset password"}</h1>
          <p className="mt-2 text-sm text-slate-600">
            We&apos;ll send a code to your phone so you can choose a{" "}
            <strong>new password</strong>.
          </p>
        </div>

        <div className="mb-6 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full ${step >= 1 ? "bg-primary-600 text-white" : "bg-slate-100 text-slate-400"
              }`}
          >
            1
          </span>
          <span className="text-slate-300"> </span>
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full ${step >= 2 ? "bg-primary-600 text-white" : "bg-slate-100 text-slate-400"
              }`}
          >
            2
          </span>
          <span className="text-slate-300"> </span>
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full ${step >= 3 ? "bg-primary-600 text-white" : "bg-slate-100 text-slate-400"
              }`}
          >
            3
          </span>
          <span className="ml-2">{"Phone"}</span>
          <span className="mx-1">·</span>
          <span>{"Code"}</span>
          <span className="mx-1">·</span>
          <span>{"New password"}</span>
        </div>

        {flowError && (
          <div
            ref={alertRef}
            role="alert"
            aria-live="assertive"
            className="mb-6 flex items-start justify-between gap-3 rounded-xl border-2 border-red-400 bg-red-100 p-4 text-sm font-semibold text-red-900 shadow-sm"
          >
            <span className="min-w-0 flex-1">{flowError}</span>
            <button
              type="button"
              onClick={() => setFlowError(null)}
              className="shrink-0 font-semibold text-red-800 underline hover:text-red-950"
            >
              {"Dismiss"}
            </button>
          </div>
        )}
        {infoMessage && !flowError && (
          <div
            ref={alertRef}
            role="status"
            className="mb-6 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm font-medium text-sky-900"
          >
            {infoMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 && (
            <>
              <div>
                <label htmlFor="forgot-phone" className="mb-1.5 block text-sm font-semibold text-slate-800">
                  {"Phone number"} <span className="text-red-500">*</span>
                </label>
                <PhonePrefixInput
                  id="forgot-phone"
                  value={phone}
                  onChange={setPhone}
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading || !normalizedPhone}
                className="mt-2 w-full h-12 text-sm font-bold shadow-md"
              >
                {sendingCode ? "Sending code…" : "Send code"}
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                {"Code sent to"} <strong className="text-slate-900">{normalizedPhone || phone}</strong>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setFlowError(null);
                    setInfoMessage(null);
                    setOtpCode("");
                  }}
                  className="ml-2 font-semibold text-primary-600 hover:text-primary-700"
                >
                  {"Change number"}
                </button>
              </p>
              <div>
                <label htmlFor="forgot-otp" className="mb-1.5 block text-sm font-semibold text-slate-700">
                  {"Verification code"}
                </label>
                <Input
                  id="forgot-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  className="text-center text-lg tracking-widest"
                  placeholder="000000"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading || otpCode.replace(/\D/g, "").length !== 6}
                className="mt-2 w-full h-12 text-sm font-bold shadow-md"
              >
                {submitting ? "Checking…" : "Continue"}
              </Button>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <label htmlFor="forgot-password" className="mb-1.5 block text-sm font-semibold text-slate-700">
                  {"New password"}
                </label>
                <div className="relative">
                  <Input
                    id="forgot-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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
                {passwordPolicyError && (
                  <p className="mt-1 text-xs text-amber-700">{passwordPolicyError}</p>
                )}
              </div>
              <div>
                <label htmlFor="forgot-confirm" className="mb-1.5 block text-sm font-semibold text-slate-700">
                  {"Confirm new password"}
                </label>
                <div className="relative">
                  <Input
                    id="forgot-confirm"
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
                {passwordsMismatch && (
                  <p className="mt-1 text-xs text-red-600">{"Passwords don’t match."}</p>
                )}
              </div>
              <Button
                type="submit"
                disabled={
                  isLoading ||
                  !!validatePasswordPolicy(newPassword) ||
                  newPassword !== confirmPassword
                }
                className="mt-2 w-full h-12 text-sm font-bold shadow-md"
              >
                {submitting ? "Updating…" : "Update password"}
              </Button>
            </>
          )}
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          {"Remember your password?"}{" "}
          <Link
            href={redirect !== "/" ? `/login?redirect=${encodeURIComponent(redirect)}` : "/login"}
            className="font-semibold text-primary-600 hover:text-primary-700"
          >
            {"Sign in"}
          </Link>
        </p>
      </div>
    </AuthSplitShell>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
        </div>
      }
    >
      <ForgotPasswordForm />
    </Suspense>
  );
}

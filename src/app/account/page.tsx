"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, User, Lock, Eye, EyeOff } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { updateProfile, changePassword } from "@/services/auth.service";
import { toastApiError } from "@/lib/toast-api-error";
import { validatePasswordPolicy } from "@/lib/passwordPolicy";
import { PhonePrefixInput } from "@/components/auth/PhonePrefixInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function AccountSettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requiredPhone = searchParams.get("required") === "phone";
  const nextUrl = searchParams.get("next");

  const { user, refreshUser } = useAuth();
  const { dict } = useLanguage();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const isGoogleOnly = user?.authProvider === "google";

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!phone.trim()) {
      toast.error(dict.account.phoneRequiredError);
      return;
    }
    setProfileSaving(true);
    try {
      await updateProfile({ fullName: fullName.trim(), phone: phone.trim() });
      await refreshUser();
      toast.success(dict.account.profileUpdatedSuccess);
      if (nextUrl && nextUrl.startsWith("/")) {
        router.push(nextUrl);
      }
    } catch (err) {
      toastApiError(err, dict.account.profileUpdateError);
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const policyErr = validatePasswordPolicy(newPassword);
    if (policyErr) {
      toast.error(policyErr);
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(dict.account.passwordsDoNotMatch);
      return;
    }
    setPasswordSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success(dict.account.passwordUpdatedSuccess);
    } catch (err) {
      toastApiError(err, dict.account.passwordUpdateError);
    } finally {
      setPasswordSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 pt-28 pb-16 sm:px-6">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[var(--brand-blue)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
        {dict.account.backToHome}
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">
          {dict.account.title}
        </h1>
        <p className="mt-2 text-sm font-medium text-slate-500 leading-relaxed">
          {dict.account.subtitle}
        </p>
      </div>

      {requiredPhone && (
        <div
          className="mb-8 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-950 shadow-sm"
          role="status"
        >
          <p className="font-bold flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
            {dict.account.phoneRequiredBannerTitle}
          </p>
          <p className="mt-1.5 text-amber-900/90 leading-relaxed font-medium">
            {dict.account.phoneRequiredBannerDesc}
          </p>
        </div>
      )}

      {/* Profile Form Card */}
      <section className="rounded-3xl border border-slate-100/80 bg-white p-6 shadow-lg shadow-slate-100/40 mb-8">
        <div className="mb-6 flex items-center gap-2 text-slate-900">
          <User className="h-5 w-5 text-[var(--brand-blue)]" strokeWidth={2.2} />
          <h2 className="text-lg font-extrabold">{dict.account.profileTitle}</h2>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-5">

          
          <div>
            <label htmlFor="fullName" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              {dict.account.fullName} <span className="text-red-500">*</span>
            </label>
            <Input
              id="fullName"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-2 h-11 border-slate-200 font-semibold text-slate-800 rounded-xl focus-visible:ring-[var(--brand-blue)] focus-visible:border-[var(--brand-blue)]"
              placeholder="e.g. John Doe"
            />
          </div>
          
          <div>
            <label htmlFor="phone" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              {dict.account.phone} <span className="text-red-500">*</span>
            </label>
            <div className="flex-1">
              <PhonePrefixInput
                id="phone"
                required
                value={phone}
                onChange={setPhone}
                placeholder="Enter your phone number"
                autoComplete="tel"
              />
            </div>
            {isGoogleOnly && (
              <p className="mt-2.5 text-xs font-semibold text-slate-400 leading-relaxed">
                {dict.account.phoneHintGoogle}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={profileSaving}
            className="w-full sm:w-auto h-11 px-8 text-sm font-bold bg-[var(--brand-blue)] hover:bg-blue-600 text-white rounded-xl shadow-md transition-all active:scale-[0.98]"
          >
            {profileSaving ? dict.account.saving : dict.account.saveChanges}
          </Button>
        </form>
      </section>

      {/* Password Security Card */}
      <section className="rounded-3xl border border-slate-100/80 bg-white p-6 shadow-lg shadow-slate-100/40 mb-8">
        <div className="mb-6 flex items-center gap-2 text-slate-900">
          <Lock className="h-5 w-5 text-[var(--brand-blue)]" strokeWidth={2.2} />
          <h2 className="text-lg font-extrabold">{dict.account.securityTitle}</h2>
        </div>

        {isGoogleOnly ? (
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
            <p className="text-sm font-semibold text-slate-600 leading-relaxed">
              {dict.account.googleNotice}
            </p>
          </div>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              {dict.account.passwordPolicyHint}
            </p>
            
            <div>
              <label htmlFor="currentPassword" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                {dict.account.currentPassword}
              </label>
              <div className="relative mt-2">
                <Input
                  id="currentPassword"
                  type={showCurrent ? "text" : "password"}
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="pr-10 h-11 border-slate-200 rounded-xl focus-visible:ring-[var(--brand-blue)] font-semibold text-slate-800"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowCurrent((v) => !v)}
                  aria-label={showCurrent ? "Hide password" : "Show password"}
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            <div>
              <label htmlFor="newPassword" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                {dict.account.newPassword}
              </label>
              <div className="relative mt-2">
                <Input
                  id="newPassword"
                  type={showNew ? "text" : "password"}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="pr-10 h-11 border-slate-200 rounded-xl focus-visible:ring-[var(--brand-blue)] font-semibold text-slate-800"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowNew((v) => !v)}
                  aria-label={showNew ? "Hide password" : "Show password"}
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                {dict.account.confirmPassword}
              </label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="mt-2 h-11 border-slate-200 rounded-xl focus-visible:ring-[var(--brand-blue)] font-semibold text-slate-800"
              />
            </div>
            
            <Button
              type="submit"
              variant="outline"
              disabled={passwordSaving}
              className="w-full sm:w-auto h-11 px-8 text-sm font-bold border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all active:scale-[0.98]"
            >
              {passwordSaving ? dict.account.updatingPassword : dict.account.updatePassword}
            </Button>
          </form>
        )}
      </section>

      {/* Terms & Privacy Band */}
      <section
        className="mt-10 rounded-2xl border border-slate-100 bg-slate-50/50 py-4 text-center"
        aria-label="Legal"
      >
        <p className="text-xs font-bold text-slate-400">
          <Link href="/terms" className="text-[var(--brand-blue)] hover:underline">
            {dict.account.termsAndConditions}
          </Link>
          <span className="mx-2 text-slate-300" aria-hidden>
            ·
          </span>
          <Link href="/privacy" className="text-[var(--brand-blue)] hover:underline">
            {dict.account.privacyPolicy}
          </Link>
        </p>
      </section>
    </div>
  );
}

export default function AccountPage() {
  return (
    <ProtectedRoute>
      <AccountSettingsContent />
    </ProtectedRoute>
  );
}

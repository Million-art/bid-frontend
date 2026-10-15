"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, User, Lock, Eye, EyeOff } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { updateProfile, changePassword } from "@/services/auth.service";
import { toastApiError } from "@/lib/toast-api-error";


import { PhonePrefixInput } from "@/components/auth/PhonePrefixInput";
import { walletService, type WalletBalance, type WalletTransaction } from "@/services/wallet.service";
import { Wallet, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function AccountSettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requiredPhone = searchParams.get("required") === "phone";
  const nextUrl = searchParams.get("next");

  const { user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [wallet, setWallet] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isWalletLoading, setIsWalletLoading] = useState(false);

  const isGoogleOnly =
    user?.authProvider === "google";

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setPhone(user.phone || "");
      fetchWallet();
    }
  }, [user]);

  const fetchWallet = async () => {
    setIsWalletLoading(true);
    try {
      const [bal, txs] = await Promise.all([
        walletService.getBalance(),
        walletService.getTransactions(1, 5)
      ]);
      setWallet(bal);
      setTransactions(txs.transactions);
    } catch (err) {
      console.error("Failed to fetch wallet:", err);
    } finally {
      setIsWalletLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!phone.trim()) {
      toast.error("Phone number is required");
      return;
    }
    setProfileSaving(true);
    try {
      await updateProfile({ fullName: fullName.trim(), phone: phone.trim() });
      await refreshUser();
      toast.success("Profile updated");
      if (nextUrl && nextUrl.startsWith("/")) {
        router.push(nextUrl);
      }
    } catch (err) {
      toastApiError(err, "Could not update your profile. Please try again.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    setPasswordSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated");
    } catch (err) {
      toastApiError(err, "Could not change your password. Check your current password and try again.");
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
        Back to Home
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Account Settings</h1>
        <p className="mt-2 text-sm font-medium text-slate-500 leading-relaxed">
          Manage your personal profile, active wallet funds, transaction history, and account security.
        </p>
      </div>

      {requiredPhone && (
        <div
          className="mb-8 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-950 shadow-sm"
          role="status"
        >
          <p className="font-bold flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
            Phone number required
          </p>
          <p className="mt-1.5 text-amber-900/90 leading-relaxed font-medium">
            Please provide a valid phone number. Then save. You can return to checkout or the auction you
            opened afterward.
          </p>
        </div>
      )}

      {/* Wallet Balance Card (Vibrant Brand Gradient) */}
      {wallet && (
        <div className="bg-gradient-to-br from-[#1b7fd8] to-[#0d599c] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden mb-6 border border-blue-400/20">
          {/* Decorative design circles */}
          <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -left-6 -top-6 w-28 h-28 bg-white/5 rounded-full blur-xl pointer-events-none" />
          
          <div className="relative flex justify-between items-center">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/80">Available Balance</span>
              <h3 className="text-4xl font-black tracking-tight mt-1.5 flex items-baseline gap-1.5">
                {wallet.availableBalance.toFixed(2)}
                <span className="text-lg font-extrabold text-[var(--brand-yellow)]">ETB</span>
              </h3>
              {wallet.pendingBalance > 0 && (
                <p className="text-xs font-semibold text-white/70 mt-1.5 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Pending: {wallet.pendingBalance.toFixed(2)} ETB
                </p>
              )}
            </div>
            <div className="p-4 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-sm shadow-inner">
              <Wallet className="h-8 w-8 text-[var(--brand-yellow)]" />
            </div>
          </div>
        </div>
      )}

      {/* Recent Transactions List Card */}
      <div className="rounded-3xl border border-slate-100/80 bg-white p-6 shadow-lg shadow-slate-100/40 mb-8">
        <div className="flex items-center gap-2 mb-5">
          <History className="h-5 w-5 text-[var(--brand-blue)]" strokeWidth={2.2} />
          <h3 className="text-base font-extrabold text-slate-900">Recent Transactions</h3>
        </div>

        {isWalletLoading ? (
          <div className="py-8 text-center text-sm text-slate-400 font-bold">Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
            <p className="text-sm font-bold text-slate-500">No transactions yet</p>
            <p className="text-xs text-slate-400 mt-1 font-semibold">Refunds and referral rewards will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border-t border-slate-100">
            {transactions.map((tx) => {
              const isPositive = tx.amount > 0;
              return (
                <div key={tx.id} className="py-4 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-950 truncate leading-snug">{tx.description}</p>
                    <p className="text-[11px] text-slate-400 font-extrabold mt-1">
                      {new Date(tx.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} · {tx.type}
                    </p>
                  </div>
                  <div className={`text-sm font-black ml-4 px-3 py-1 rounded-full border ${isPositive ? "bg-emerald-50 text-emerald-600 border-emerald-100/80" : "bg-rose-50 text-rose-600 border-rose-100/80"}`}>
                    {isPositive ? "+" : ""}{tx.amount.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Profile Form Card */}
      <section className="rounded-3xl border border-slate-100/80 bg-white p-6 shadow-lg shadow-slate-100/40 mb-8">
        <div className="mb-6 flex items-center gap-2 text-slate-900">
          <User className="h-5 w-5 text-[var(--brand-blue)]" strokeWidth={2.2} />
          <h2 className="text-lg font-extrabold">Profile Details</h2>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Email Address (Cannot be changed)
            </label>
            <Input
              id="email"
              type="email"
              value={user.email || ""}
              disabled
              className="mt-2 h-11 bg-slate-50 border-slate-200 text-slate-500 font-medium rounded-xl select-none"
            />
          </div>
          
          <div>
            <label htmlFor="fullName" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Full Name <span className="text-red-500">*</span>
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
              Phone Number <span className="text-red-500">*</span>
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
            <p className="mt-2.5 text-xs font-semibold text-slate-400 leading-relaxed">
              {isGoogleOnly ? "Google accounts do not share a phone with us." : ""}
            </p>
          </div>

          <Button
            type="submit"
            disabled={profileSaving}
            className="w-full sm:w-auto h-11 px-8 text-sm font-bold bg-[var(--brand-blue)] hover:bg-blue-600 text-white rounded-xl shadow-md transition-all active:scale-[0.98]"
          >
            {profileSaving ? "Saving details…" : "Save profile"}
          </Button>
        </form>
      </section>

      {/* Password Security Card */}
      <section className="rounded-3xl border border-slate-100/80 bg-white p-6 shadow-lg shadow-slate-100/40 mb-8">
        <div className="mb-6 flex items-center gap-2 text-slate-900">
          <Lock className="h-5 w-5 text-[var(--brand-blue)]" strokeWidth={2.2} />
          <h2 className="text-lg font-extrabold">Account Security</h2>
        </div>

        {isGoogleOnly ? (
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
            <p className="text-sm font-semibold text-slate-600 leading-relaxed">
              You are signed in with <strong className="text-slate-800">Google</strong>. Password changes are disabled for this account. To secure your account, please manage your settings on Google.
            </p>
          </div>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              Use at least 8 characters with uppercase, lowercase, and a number.
            </p>
            
            <div>
              <label htmlFor="currentPassword" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Current Password
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
                New Password
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
                Confirm New Password
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
              {passwordSaving ? "Updating password…" : "Change password"}
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
            Terms &amp; Conditions
          </Link>
          <span className="mx-2 text-slate-300" aria-hidden>
            ·
          </span>
          <Link href="/privacy" className="text-[var(--brand-blue)] hover:underline">
            Privacy Policy
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

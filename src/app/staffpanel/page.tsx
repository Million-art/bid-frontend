"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  LogOut,
  Plus,
  RefreshCw,
  Play,
  Clock,
  Lock,
  Ban,
  Trophy,
  Edit3,
  Users,
  Gavel,
  Search,
  Upload,
  X,
  ArrowUpRight,
  UserCog,
  Contact,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { isStaffRole } from "@/services/auth.service";
import { getCsrfToken } from "@/lib/api";
import { toastApiError } from "@/lib/toast-api-error";
import { AuthSplitShell } from "@/components/auth/AuthSplitShell";
import { PhonePrefixInput } from "@/components/auth/PhonePrefixInput";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { StaffUsersPanel } from "@/components/staff/StaffUsersPanel";
import { ParticipantsPanel } from "@/components/staff/ParticipantsPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  listStaffAuctions,
  createStaffAuction,
  updateStaffAuction,
  activateStaffAuction,
  postponeStaffAuction,
  closeStaffAuction,
  cancelStaffAuction,
  executeStaffAuctionDraw,
  listStaffAuctionParticipants,
  listStaffAuctionBids,
  uploadStaffMedia,
  type StaffAuctionPayload,
} from "@/services/staff.service";
import { auctionCoverImage, auctionImageList } from "@/lib/auction-media";
import type { Auction } from "@/lib/schemas";

type StaffSection = "auctions" | "users" | "customers";

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  postponed: "bg-amber-50 text-amber-800 border-amber-200",
  closed: "bg-sky-50 text-sky-700 border-sky-200",
  executed: "bg-blue-50 text-[var(--brand-blue)] border-blue-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

function toLocalDatetimeInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function fromLocalDatetimeInput(val: string): string | null {
  if (!val.trim()) return null;
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function StaffLoginShell() {
  const { user, login, logout, error, clearError } = useAuth();
  const [useEmail, setUseEmail] = useState(true);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getCsrfToken().catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSubmitting(true);
    const identifier = useEmail ? email.trim() : phone.trim();
    try {
      const res = await login({ identifier, password });
      if (!isStaffRole(res.user?.role)) {
        toast.error(
          "Signed-in account does not have staff privileges (admin or super_admin required)."
        );
      } else {
        toast.success(`Welcome back, ${res.user.fullName}`);
      }
    } catch {
      /* AuthContext sets error */
    } finally {
      setSubmitting(false);
    }
  };

  const linkClass =
    "font-semibold text-brand-blue underline-offset-2 hover:text-blue-600 hover:underline";

  return (
    <AuthSplitShell>
      <header className="mb-4">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-brand-blue">
          <ShieldCheck className="h-3.5 w-3.5" />
          Staff Portal
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl sm:leading-tight">
          Staff Sign In
        </h1>
        <p className="mt-1 max-w-md text-sm leading-snug text-slate-600">
          Sign in with your administrator or compliance account to manage
          CarraMarket auctions.
        </p>
      </header>

      {user && !isStaffRole(user.role) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sky-200 bg-sky-50/90 px-3.5 py-2.5 text-xs text-sky-950">
          <span>
            Currently signed in as{" "}
            <strong className="font-bold">{user.fullName}</strong> (
            <code>{user.role || "participant"}</code>). Sign in below with a
            staff account to switch.
          </span>
          <button
            type="button"
            onClick={() => logout()}
            className="shrink-0 font-bold text-brand-blue hover:underline"
          >
            Sign out
          </button>
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
            Dismiss
          </button>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200/90 bg-white px-4 py-4 shadow-sm sm:px-5 sm:py-5"
      >
        <div className="space-y-3.5 sm:space-y-4">
          <div>
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <label
                htmlFor="staff-login-identifier"
                className="text-sm font-semibold text-slate-800"
              >
                {useEmail ? "Staff Email" : "Phone number"}
              </label>
              <button
                type="button"
                onClick={() => {
                  setUseEmail(!useEmail);
                  clearError();
                }}
                className="text-xs font-medium text-brand-blue hover:text-blue-600"
              >
                {useEmail ? "Use phone" : "Use email"}
              </button>
            </div>
            {useEmail ? (
              <Input
                id="staff-login-identifier"
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@carramarket.com"
              />
            ) : (
              <PhonePrefixInput
                id="staff-login-identifier"
                value={phone}
                onChange={setPhone}
                required
                aria-invalid={Boolean(error)}
              />
            )}
          </div>

          <div>
            <label
              htmlFor="staff-login-password"
              className="mb-1.5 block text-sm font-semibold text-slate-800"
            >
              Password
            </label>
            <div className="relative">
              <Input
                id="staff-login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-11"
                placeholder="Your staff password"
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

          <div className="flex items-center justify-end pt-1">
            <Link
              href="/forgot-password?redirect=%2Fstaffpanel"
              className={`text-sm ${linkClass}`}
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="h-12 w-full text-sm font-bold shadow-sm"
          >
            {submitting ? "Signing in…" : "Sign in to Staff Panel"}
          </Button>
        </div>
      </form>

      <p className="mt-4 text-center text-sm text-slate-600">
        Looking for participant bidding?{" "}
        <Link href="/auctions" className={linkClass}>
          Browse live auctions
        </Link>
      </p>
    </AuthSplitShell>
  );
}

function AuctionFormModal({
  initial,
  onClose,
  onSaved,
}: {
  initial?: Auction | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = Boolean(initial);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [imageUrls, setImageUrls] = useState<string[]>(
    initial ? auctionImageList(initial) : []
  );
  const [videoUrl, setVideoUrl] = useState(initial?.videoUrl ?? "");
  const [entranceFee, setEntranceFee] = useState(
    initial?.entranceFee ? String(initial.entranceFee) : "100"
  );
  const [retailValue, setRetailValue] = useState(
    initial?.retailValue ? String(initial.retailValue) : ""
  );
  const [minParticipants, setMinParticipants] = useState(
    initial?.minParticipants ? String(initial.minParticipants) : "10"
  );
  const [minBidValue, setMinBidValue] = useState(
    initial?.minBidValue ? String(initial.minBidValue) : "0.01"
  );
  const [maxBidValue, setMaxBidValue] = useState(
    initial?.maxBidValue != null ? String(initial.maxBidValue) : ""
  );
  const [startAt, setStartAt] = useState(
    toLocalDatetimeInput(initial?.startAt)
  );
  const [closeAt, setCloseAt] = useState(
    toLocalDatetimeInput(initial?.closeAt)
  );
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setUploadingImage(true);
    try {
      for (const file of files) {
        const { url } = await uploadStaffMedia(file);
        if (file.type.startsWith("video/")) {
          setVideoUrl(url);
        } else {
          setImageUrls((prev) => {
            if (prev.includes(url) || prev.length >= 8) return prev;
            return [...prev, url];
          });
        }
      }
      toast.success("Media uploaded");
    } catch (err) {
      toastApiError(err, "Media upload failed");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fee = Number(entranceFee);
    const retail = retailValue.trim() ? Number(retailValue) : 0;
    const minParts = Number(minParticipants || "10");
    const minBid = Number(minBidValue || "0.01");
    const maxBid = maxBidValue.trim() ? Number(maxBidValue) : null;

    if (!title.trim() || title.trim().length < 2) {
      toast.error("Title must be at least 2 characters");
      return;
    }
    if (!Number.isFinite(fee) || fee <= 0) {
      toast.error("Entrance fee must be greater than 0");
      return;
    }
    if (retailValue.trim() && (!Number.isFinite(retail) || retail < 0)) {
      toast.error("Retail value must be 0 or greater");
      return;
    }
    if (!Number.isFinite(minParts) || minParts < 1) {
      toast.error("Minimum participants must be at least 1");
      return;
    }

    const payload: StaffAuctionPayload = {
      title: title.trim(),
      description: description.trim(),
      imageUrl: imageUrls[0] || undefined,
      imageUrls,
      videoUrl: videoUrl.trim() || undefined,
      entranceFee: fee,
      retailValue: retail > 0 ? retail : 0,
      minParticipants: minParts,
      minBidValue: minBid > 0 ? minBid : 0.01,
      maxBidValue: maxBid,
      startAt: fromLocalDatetimeInput(startAt),
      closeAt: fromLocalDatetimeInput(closeAt),
    };

    setSaving(true);
    try {
      if (isEdit && initial) {
        await updateStaffAuction(initial.id, payload);
        toast.success("Auction updated");
      } else {
        await createStaffAuction(payload);
        toast.success("Auction created in draft status");
      }
      onSaved();
      onClose();
    } catch (err) {
      toastApiError(err, "Failed to save auction");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--brand-blue)]">
              CarraMarket Staff
            </p>
            <h2 className="text-lg font-extrabold text-slate-900">
              {isEdit ? "Edit Auction" : "Create New LUB Auction"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-800">
              Product Title *
            </label>
            <Input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. iPhone 16 Pro Max 256GB"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-800">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Product specifications, condition, and delivery details..."
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-[var(--brand-blue)] focus:outline-hidden"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-800">
                Entrance Fee (ETB) *
              </label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={entranceFee}
                onChange={(e) => setEntranceFee(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-800">
                Retail value (ETB)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={retailValue}
                onChange={(e) => setRetailValue(e.target.value)}
                placeholder="e.g. 45000"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-800">
                Min participants
              </label>
              <Input
                type="number"
                step="1"
                min="1"
                value={minParticipants}
                onChange={(e) => setMinParticipants(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-800">
                Min Bid (ETB)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={minBidValue}
                onChange={(e) => setMinBidValue(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-semibold text-slate-800">
                Max Bid (ETB)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={maxBidValue}
                onChange={(e) => setMaxBidValue(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-800">
                Start Date & Time
              </label>
              <Input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-800">
                Auto-Close Date & Time
              </label>
              <Input
                type="datetime-local"
                value={closeAt}
                onChange={(e) => setCloseAt(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Product media
              </span>
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 shadow-2xs transition hover:bg-slate-50">
                <Upload className="h-3.5 w-3.5 text-[var(--brand-blue)]" />
                {uploadingImage ? "Uploading…" : "Upload images/video"}
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  disabled={uploadingImage || imageUrls.length >= 8}
                  onChange={handleFileUpload}
                />
              </label>
            </div>
            {imageUrls.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {imageUrls.map((url, index) => (
                  <div
                    key={`${url}-${index}`}
                    className="relative overflow-hidden rounded-xl border border-slate-200 bg-white"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-20 w-full object-cover" />
                    {index === 0 ? (
                      <span className="absolute left-1 top-1 rounded bg-[var(--brand-blue)] px-1.5 py-0.5 text-[10px] font-bold text-white">
                        Cover
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setImageUrls((prev) => [
                            url,
                            ...prev.filter((_, i) => i !== index),
                          ])
                        }
                        className="absolute left-1 top-1 rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-bold text-slate-700"
                      >
                        Cover
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setImageUrls((prev) => prev.filter((_, i) => i !== index))
                      }
                      className="absolute right-1 top-1 rounded-full bg-white/90 p-0.5 text-slate-600"
                      aria-label="Remove image"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Upload up to 8 product photos. The first image is the cover.
              </p>
            )}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Video URL (optional)
              </label>
              <Input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://cdn.carramarket.com/..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || uploadingImage}>
              {saving
                ? "Saving…"
                : isEdit
                ? "Save Changes"
                : "Create Draft Auction"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AuctionActivityModal({
  auction,
  onClose,
}: {
  auction: Auction;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"bids" | "participants">("bids");

  const bidsQuery = useQuery({
    queryKey: ["staff", "auction", auction.id, "bids"],
    queryFn: () => listStaffAuctionBids(auction.id, { page: 1, limit: 100 }),
  });

  const partsQuery = useQuery({
    queryKey: ["staff", "auction", auction.id, "participants"],
    queryFn: () =>
      listStaffAuctionParticipants(auction.id, { page: 1, limit: 100 }),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
      <div className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--brand-blue)]">
              Auction Activity
            </p>
            <h2 className="text-lg font-extrabold text-slate-900">
              {auction.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex border-b border-slate-200 bg-slate-50 px-6">
          <button
            type="button"
            onClick={() => setTab("bids")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold uppercase tracking-wider ${
              tab === "bids"
                ? "border-[var(--brand-blue)] text-[var(--brand-blue)]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Gavel className="h-4 w-4" />
            Bids ({bidsQuery.data?.total ?? 0})
          </button>
          <button
            type="button"
            onClick={() => setTab("participants")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold uppercase tracking-wider ${
              tab === "participants"
                ? "border-[var(--brand-blue)] text-[var(--brand-blue)]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Users className="h-4 w-4" />
            Participants ({partsQuery.data?.total ?? 0})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {tab === "bids" ? (
            bidsQuery.isLoading ? (
              <p className="py-10 text-center text-sm text-slate-500">
                Loading bids…
              </p>
            ) : !bidsQuery.data?.items.length ? (
              <p className="py-10 text-center text-sm text-slate-500">
                No bids placed on this auction yet.
              </p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                    <th className="pb-2 font-bold">Bid Value (ETB)</th>
                    <th className="pb-2 font-bold">Participant ID</th>
                    <th className="pb-2 font-bold">Flags</th>
                    <th className="pb-2 font-bold">Placed At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bidsQuery.data.items.map((b) => (
                    <tr key={b.id}>
                      <td className="py-2.5 font-bold text-slate-900">
                        {b.bidValue.toFixed(2)} ETB
                      </td>
                      <td className="py-2.5 font-mono text-xs text-slate-600">
                        {b.participantId || " "}
                      </td>
                      <td className="py-2.5">
                        <div className="flex gap-1.5">
                          {b.isWinner && (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-[var(--brand-blue)]">
                              Winner
                            </span>
                          )}
                          {b.isUnique && (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                              Unique
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 text-xs text-slate-500">
                        {b.placedAt
                          ? new Date(b.placedAt).toLocaleString()
                          : " "}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : partsQuery.isLoading ? (
            <p className="py-10 text-center text-sm text-slate-500">
              Loading participants…
            </p>
          ) : !partsQuery.data?.items.length ? (
            <p className="py-10 text-center text-sm text-slate-500">
              No participants have paid the entrance fee yet.
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="pb-2 font-bold">Participant ID</th>
                  <th className="pb-2 font-bold">Fee Paid</th>
                  <th className="pb-2 font-bold">Tx Ref</th>
                  <th className="pb-2 font-bold">Status</th>
                  <th className="pb-2 font-bold">Joined At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {partsQuery.data.items.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2.5 font-mono text-xs text-slate-700">
                      {p.participantId || " "}
                    </td>
                    <td className="py-2.5 font-semibold text-slate-900">
                      {p.feePaid != null ? `${p.feePaid.toFixed(2)} ETB` : " "}
                    </td>
                    <td className="py-2.5 font-mono text-xs text-slate-500">
                      {p.transactionId || " "}
                    </td>
                    <td className="py-2.5">
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold uppercase text-slate-700">
                        {p.status || "active"}
                      </span>
                    </td>
                    <td className="py-2.5 text-xs text-slate-500">
                      {p.createdAt
                        ? new Date(p.createdAt).toLocaleString()
                        : " "}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StaffPanelPage() {
  const { user, loading, logout } = useAuth();
  const qc = useQueryClient();

  const [section, setSection] = useState<StaffSection>("auctions");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [modalAuction, setModalAuction] = useState<Auction | null | undefined>(
    undefined
  );
  const [activityAuction, setActivityAuction] = useState<Auction | null>(null);
  const [postponeTarget, setPostponeTarget] = useState<Auction | null>(null);
  const [newCloseAt, setNewCloseAt] = useState<string>("");

  const isStaff = isStaffRole(user?.role);
  const canMutateAuctions = ["super_admin", "admin"].includes(
    (user?.role || "").toLowerCase()
  );

  const auctionsQuery = useQuery({
    queryKey: ["staff", "auctions", { statusFilter, search }],
    queryFn: () =>
      listStaffAuctions({
        page: 1,
        limit: 50,
        status: statusFilter || undefined,
        search: search.trim() || undefined,
      }),
    enabled: Boolean(
      user && isStaff && canMutateAuctions && section === "auctions"
    ),
  });

  const refreshAuctions = () => {
    void qc.invalidateQueries({ queryKey: ["staff", "auctions"] });
  };

  const actionMutation = useMutation({
    mutationFn: async (fn: () => Promise<unknown>) => fn(),
    onSuccess: () => {
      refreshAuctions();
    },
    onError: (err) => {
      toastApiError(err, "Action failed");
    },
  });

  if (loading) {
    return (
      <AuthSplitShell>
        <div className="flex min-h-[40vh] items-center justify-center lg:min-h-[50vh]">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-blue border-t-transparent" />
        </div>
      </AuthSplitShell>
    );
  }

  // If unauthenticated OR signed in as a non-staff participant, show the on-brand AuthSplitShell login form
  if (!user || !isStaff) {
    return <StaffLoginShell />;
  }

  const auctions = auctionsQuery.data?.items ?? [];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* On-Brand CarraMarket White Navbar */}
      <nav className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex shrink-0 items-center">
              <Image
                src="/logo.png"
                alt="CarraMarket"
                width={160}
                height={50}
                className="h-9 w-auto object-contain sm:h-12"
                priority
              />
            </Link>
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[var(--brand-blue)]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Staff · {user.role}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/auctions"
              className="hidden items-center gap-1 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 sm:inline-flex"
            >
              Live Auctions <ArrowUpRight className="h-4 w-4" />
            </Link>
            <NotificationBell />
            <div className="hidden items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 md:flex">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-extrabold text-slate-900">
                {user.fullName?.charAt(0)?.toUpperCase() ||
                  user.email?.charAt(0)?.toUpperCase()}
              </span>
              <span className="max-w-[140px] truncate">
                {user.fullName || user.email}
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => logout()}
              className="rounded-xl border-slate-200 font-bold text-slate-700 hover:bg-slate-50"
            >
              <LogOut className="mr-1.5 h-4 w-4 text-slate-500" />
              Sign out
            </Button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          {(
            [
              { id: "auctions", label: "Auctions", icon: Gavel },
              { id: "users", label: "Staff users", icon: UserCog },
              { id: "customers", label: "Customers", icon: Contact },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setSection(id)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-bold transition ${
                section === id
                  ? "bg-[var(--brand-blue)] text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {section === "users" && (
          <StaffUsersPanel
            actorRole={String(user.role || "")}
            actorId={user.id}
          />
        )}

        {section === "customers" && (
          <ParticipantsPanel actorRole={String(user.role || "")} />
        )}

        {section === "auctions" && (
          <>
        {/* Header & Primary Actions */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--brand-blue)]">
              CarraMarket Staff Panel
            </p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Auctions Management
            </h1>
            <p className="mt-2 text-base text-slate-600">
              Create, activate, postpone, close, and execute draws for Lowest
              Unique Bid auctions.
            </p>
          </div>
          {canMutateAuctions && (
            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                onClick={refreshAuctions}
                disabled={auctionsQuery.isFetching}
                className="rounded-xl border-slate-200 bg-white font-bold text-slate-700"
              >
                <RefreshCw
                  className={`mr-1.5 h-4 w-4 ${
                    auctionsQuery.isFetching ? "animate-spin" : ""
                  }`}
                />
                Refresh
              </Button>
              <Button
                onClick={() => setModalAuction(null)}
                className="rounded-xl bg-[var(--brand-blue)] font-bold text-white shadow-md shadow-blue-500/20 hover:brightness-110"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                New Auction
              </Button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {[
              "",
              "draft",
              "active",
              "postponed",
              "closed",
              "executed",
              "cancelled",
            ].map((st) => (
              <button
                key={st || "all"}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
                  statusFilter === st
                    ? "bg-[var(--brand-blue)] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {st || "All"}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search auction title…"
              className="h-10 rounded-xl pl-9 text-sm"
            />
          </div>
        </div>

        {/* Auctions List */}
        <div className="mt-6">
          {!canMutateAuctions ? (
            <div className="rounded-2xl border border-sky-200 bg-sky-50/80 p-6 text-sm text-sky-950">
              Your role (<code>{user.role}</code>) is compliance-scoped; auction
              creation and lifecycle mutations require <code>admin</code> or{" "}
              <code>super_admin</code>.
            </div>
          ) : auctionsQuery.isLoading ? (
            <div className="flex justify-center py-20">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--brand-blue)] border-t-transparent" />
            </div>
          ) : auctionsQuery.error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center text-red-800">
              Could not load staff auctions. Please try again.
            </div>
          ) : auctions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-slate-500">
              <p className="text-base font-bold text-slate-800">
                No auctions found
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Create a new draft auction to get started.
              </p>
              <Button
                className="mt-4 rounded-xl bg-[var(--brand-blue)] font-bold text-white"
                onClick={() => setModalAuction(null)}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Create First Auction
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {auctions.map((auction) => {
                const st = String(auction.status);
                const badgeClass =
                  STATUS_BADGE[st] ||
                  "bg-slate-100 text-slate-700 border-slate-200";

                return (
                  <div
                    key={auction.id}
                    className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[var(--brand-blue)]/40 lg:flex-row lg:items-center"
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-100">
                        {auctionCoverImage(auction) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={auctionCoverImage(auction) ?? ""}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider ${badgeClass}`}
                          >
                            {st}
                          </span>
                          <h3 className="text-lg font-extrabold text-slate-900">
                            {auction.title}
                          </h3>
                        </div>

                        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                          <span>
                            Entrance Fee:{" "}
                            <strong className="text-slate-900">
                              {auction.entranceFee.toFixed(2)} ETB
                            </strong>
                          </span>
                          <span>
                            Bid Range:{" "}
                            <strong className="text-slate-900">
                              {auction.minBidValue.toFixed(2)} –{" "}
                              {auction.maxBidValue != null
                                ? `${auction.maxBidValue.toFixed(2)} ETB`
                                : "No max"}
                            </strong>
                          </span>
                          {auction.closeAt && (
                            <span>
                              Closes:{" "}
                              <strong className="text-slate-900">
                                {new Date(auction.closeAt).toLocaleString()}
                              </strong>
                            </span>
                          )}
                          {auction.winnerBidValue != null && (
                            <span className="font-bold text-[var(--brand-blue)]">
                              Winning LUB: {auction.winnerBidValue.toFixed(2)}{" "}
                              ETB
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Lifecycle & Inspection Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActivityAuction(auction)}
                        className="rounded-xl border-slate-200 font-bold"
                      >
                        <Users className="mr-1.5 h-3.5 w-3.5" />
                        Bids & Participants
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setModalAuction(auction)}
                        className="rounded-xl border-slate-200 font-bold"
                      >
                        <Edit3 className="mr-1.5 h-3.5 w-3.5" />
                        Edit
                      </Button>

                      {st === "draft" && (
                        <Button
                          size="sm"
                          onClick={() =>
                            actionMutation.mutate(async () => {
                              await activateStaffAuction(auction.id);
                              toast.success("Auction activated");
                            })
                          }
                          disabled={actionMutation.isPending}
                          className="rounded-xl bg-emerald-600 font-bold text-white hover:bg-emerald-700"
                        >
                          <Play className="mr-1.5 h-3.5 w-3.5" />
                          Activate
                        </Button>
                      )}

                      {(st === "active" || st === "postponed") && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setPostponeTarget(auction);
                              setNewCloseAt(
                                toLocalDatetimeInput(auction.closeAt)
                              );
                            }}
                            className="rounded-xl border-slate-200 font-bold"
                          >
                            <Clock className="mr-1.5 h-3.5 w-3.5" />
                            Postpone
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              actionMutation.mutate(async () => {
                                await closeStaffAuction(auction.id);
                                toast.success("Auction closed for bidding");
                              })
                            }
                            disabled={actionMutation.isPending}
                            className="rounded-xl border-slate-200 font-bold"
                          >
                            <Lock className="mr-1.5 h-3.5 w-3.5" />
                            Close
                          </Button>
                        </>
                      )}

                      {(st === "active" ||
                        st === "postponed" ||
                        st === "closed") && (
                        <Button
                          size="sm"
                          onClick={() =>
                            actionMutation.mutate(async () => {
                              const res = await executeStaffAuctionDraw(
                                auction.id
                              );
                              const hasWinner =
                                res.result?.HasWinner ?? res.result?.hasWinner;
                              const val =
                                res.result?.WinnerBidValue ??
                                res.result?.winnerBidValue;
                              if (hasWinner) {
                                toast.success(
                                  `Draw executed! Winning bid: ${val} ETB`
                                );
                              } else {
                                toast.info(
                                  res.message ||
                                    "Draw executed: no unique bid found"
                                );
                              }
                            })
                          }
                          disabled={actionMutation.isPending}
                          className="rounded-xl bg-[var(--brand-blue)] font-bold text-white hover:brightness-110"
                        >
                          <Trophy className="mr-1.5 h-3.5 w-3.5" />
                          Execute Draw
                        </Button>
                      )}

                      {(st === "draft" ||
                        st === "active" ||
                        st === "postponed") && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            actionMutation.mutate(async () => {
                              await cancelStaffAuction(auction.id);
                              toast.success("Auction cancelled");
                            })
                          }
                          disabled={actionMutation.isPending}
                          className="rounded-xl border-red-200 font-bold text-red-600 hover:bg-red-50"
                        >
                          <Ban className="mr-1.5 h-3.5 w-3.5" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
          </>
        )}
      </main>

      {/* Create / Edit Modal */}
      {modalAuction !== undefined && (
        <AuctionFormModal
          initial={modalAuction}
          onClose={() => setModalAuction(undefined)}
          onSaved={refreshAuctions}
        />
      )}

      {/* Bids & Participants Inspection Modal */}
      {activityAuction && (
        <AuctionActivityModal
          auction={activityAuction}
          onClose={() => setActivityAuction(null)}
        />
      )}

      {/* Postpone Modal */}
      {postponeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--brand-blue)]">
              Schedule Update
            </p>
            <h3 className="mt-1 text-lg font-extrabold text-slate-900">
              Postpone Auction
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Select a new closing date and time for{" "}
              <strong>{postponeTarget.title}</strong>.
            </p>
            <div className="mt-4">
              <label className="mb-1.5 block text-sm font-semibold text-slate-800">
                New Close Date & Time *
              </label>
              <Input
                type="datetime-local"
                value={newCloseAt}
                onChange={(e) => setNewCloseAt(e.target.value)}
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setPostponeTarget(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const iso = fromLocalDatetimeInput(newCloseAt);
                  if (!iso) {
                    toast.error("Please select a valid date and time");
                    return;
                  }
                  actionMutation.mutate(async () => {
                    await postponeStaffAuction(postponeTarget.id, iso);
                    toast.success("Auction postponed");
                    setPostponeTarget(null);
                  });
                }}
                disabled={actionMutation.isPending}
              >
                Save New Close Time
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  RefreshCw,
  Search,
  ShieldBan,
  ShieldCheck,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toastApiError } from "@/lib/toast-api-error";
import {
  createStaffUser,
  deleteStaffUser,
  listStaffUsers,
  updateStaffUserStatus,
  type StaffUser,
} from "@/services/staff.service";

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  suspended: "bg-red-50 text-red-700 border-red-200",
  pending: "bg-amber-50 text-amber-800 border-amber-200",
};

function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function InviteStaffModal({
  actorRole,
  onClose,
  onCreated,
}: {
  actorRole: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const canInviteAdmin = actorRole === "super_admin";
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"admin" | "compliance">(
    canInviteAdmin ? "admin" : "compliance"
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || fullName.trim().length < 2) {
      toast.error("Full name must be at least 2 characters");
      return;
    }
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }
    setSaving(true);
    try {
      await createStaffUser({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        role,
      });
      toast.success("Invite sent — they will set a password via email");
      onCreated();
      onClose();
    } catch (err) {
      toastApiError(err, "Failed to invite staff user");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--brand-blue)]">
              Staff invite
            </p>
            <h2 className="text-lg font-extrabold text-slate-900">
              Invite staff user
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
              Full name *
            </label>
            <Input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Admin"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-800">
              Email *
            </label>
            <Input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@carramarket.com"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-800">
              Phone
            </label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+2519…"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-800">
              Role *
            </label>
            <select
              value={role}
              onChange={(e) =>
                setRole(e.target.value as "admin" | "compliance")
              }
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800"
            >
              {canInviteAdmin && <option value="admin">Admin</option>}
              <option value="compliance">Compliance</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-[var(--brand-blue)] font-bold text-white"
            >
              <UserPlus className="mr-1.5 h-4 w-4" />
              {saving ? "Sending…" : "Send invite"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function StaffUsersPanel({
  actorRole,
  actorId,
}: {
  actorRole: string;
  actorId?: string;
}) {
  const qc = useQueryClient();
  const role = actorRole.toLowerCase();
  const canMutate = ["super_admin", "admin"].includes(role);
  const canInvite =
    role === "super_admin" || role === "admin";

  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [showInvite, setShowInvite] = useState(false);

  const query = useQuery({
    queryKey: ["staff", "users", { statusFilter, search }],
    queryFn: () =>
      listStaffUsers({
        page: 1,
        limit: 50,
        status: statusFilter || undefined,
        search: search.trim() || undefined,
      }),
  });

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["staff", "users"] });
  };

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "active" | "suspended";
    }) => updateStaffUserStatus(id, status),
    onSuccess: () => {
      toast.success("User status updated");
      refresh();
    },
    onError: (err) => toastApiError(err, "Failed to update status"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteStaffUser(id),
    onSuccess: () => {
      toast.success("User deleted");
      refresh();
    },
    onError: (err) => toastApiError(err, "Failed to delete user"),
  });

  const items = query.data?.items ?? [];

  const canActOn = useMemo(
    () => (user: StaffUser) => {
      if (!canMutate) return false;
      if (user.id === actorId) return false;
      if (
        user.role?.toLowerCase() === "super_admin" &&
        role !== "super_admin"
      ) {
        return false;
      }
      return true;
    },
    [actorId, canMutate, role]
  );

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--brand-blue)]">
            Access control
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Staff users
          </h1>
          <p className="mt-2 text-base text-slate-600">
            Invite admins and compliance officers, and suspend or remove access.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={refresh}
            disabled={query.isFetching}
            className="rounded-xl border-slate-200 bg-white font-bold text-slate-700"
          >
            <RefreshCw
              className={`mr-1.5 h-4 w-4 ${
                query.isFetching ? "animate-spin" : ""
              }`}
            />
            Refresh
          </Button>
          {canInvite && (
            <Button
              onClick={() => setShowInvite(true)}
              className="rounded-xl bg-[var(--brand-blue)] font-bold text-white shadow-md shadow-blue-500/20 hover:brightness-110"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Invite staff
            </Button>
          )}
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {["", "active", "pending", "suspended"].map((st) => (
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
            placeholder="Search name or email…"
            className="h-10 rounded-xl pl-9 text-sm"
          />
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {query.isLoading ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-blue border-t-transparent" />
          </div>
        ) : query.isError ? (
          <div className="p-6 text-sm text-red-700">
            Could not load staff users.{" "}
            <button
              type="button"
              className="font-bold underline"
              onClick={refresh}
            >
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No staff users match your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((user) => {
                  const st = String(user.status || "active").toLowerCase();
                  const actionable = canActOn(user);
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {user.fullName || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{user.email}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {user.phone || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-bold ${
                            STATUS_BADGE[st] ?? STATUS_BADGE.active
                          }`}
                        >
                          {st}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          {actionable && st !== "suspended" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 rounded-lg text-xs"
                              disabled={statusMutation.isPending}
                              onClick={() =>
                                statusMutation.mutate({
                                  id: user.id,
                                  status: "suspended",
                                })
                              }
                            >
                              <ShieldBan className="mr-1 h-3.5 w-3.5" />
                              Suspend
                            </Button>
                          )}
                          {actionable && st === "suspended" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 rounded-lg text-xs"
                              disabled={statusMutation.isPending}
                              onClick={() =>
                                statusMutation.mutate({
                                  id: user.id,
                                  status: "active",
                                })
                              }
                            >
                              <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                              Activate
                            </Button>
                          )}
                          {actionable && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 rounded-lg border-red-200 text-xs text-red-700 hover:bg-red-50"
                              disabled={deleteMutation.isPending}
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Delete ${user.fullName || user.email}? This cannot be undone.`
                                  )
                                ) {
                                  deleteMutation.mutate(user.id);
                                }
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showInvite && (
        <InviteStaffModal
          actorRole={role}
          onClose={() => setShowInvite(false)}
          onCreated={refresh}
        />
      )}
    </div>
  );
}

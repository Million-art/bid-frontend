"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  RefreshCw,
  Search,
  ShieldBan,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toastApiError } from "@/lib/toast-api-error";
import {
  deleteParticipant,
  listParticipants,
  updateParticipantStatus,
} from "@/services/staff.service";

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  suspended: "bg-red-50 text-red-700 border-red-200",
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

export function ParticipantsPanel({ actorRole }: { actorRole: string }) {
  const qc = useQueryClient();
  const role = actorRole.toLowerCase();
  const canSuspend = ["super_admin", "admin", "compliance"].includes(role);
  const canDelete = ["super_admin", "admin"].includes(role);

  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const query = useQuery({
    queryKey: ["staff", "participants", { statusFilter, search }],
    queryFn: () =>
      listParticipants({
        page: 1,
        limit: 50,
        status: statusFilter || undefined,
        search: search.trim() || undefined,
      }),
  });

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["staff", "participants"] });
  };

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "active" | "suspended";
    }) => updateParticipantStatus(id, status),
    onSuccess: () => {
      toast.success("Customer status updated");
      refresh();
    },
    onError: (err) => toastApiError(err, "Failed to update status"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteParticipant(id),
    onSuccess: () => {
      toast.success("Customer deleted");
      refresh();
    },
    onError: (err) => toastApiError(err, "Failed to delete customer"),
  });

  const items = query.data?.items ?? [];

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--brand-blue)]">
            Customers
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Participant management
          </h1>
          <p className="mt-2 text-base text-slate-600">
            View signup accounts, suspend abusers, and remove customer profiles.
          </p>
        </div>
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
      </div>

      <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {["", "active", "suspended"].map((st) => (
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
            placeholder="Search name, email, phone…"
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
            Could not load customers.{" "}
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
            No customers match your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((user) => {
                  const st = String(user.status || "active").toLowerCase();
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {user.fullName || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {user.email || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {user.phone || "—"}
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
                          {canSuspend && st !== "suspended" && (
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
                          {canSuspend && st === "suspended" && (
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
                          {canDelete && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 rounded-lg border-red-200 text-xs text-red-700 hover:bg-red-50"
                              disabled={deleteMutation.isPending}
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Delete customer ${user.fullName || user.email || user.phone}? This cannot be undone.`
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
    </div>
  );
}

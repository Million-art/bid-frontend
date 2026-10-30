"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RefreshCw, Search, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toastApiError } from "@/lib/toast-api-error";
import {
  listStaffPayments,
  refundStaffPayment,
  type StaffPaymentRow,
} from "@/services/staff.service";

const STATUS_FILTERS = [
  { id: "", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "success", label: "Success" },
  { id: "failed", label: "Failed" },
  { id: "refunded", label: "Refunded" },
] as const;

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-800 border-amber-200",
  success: "bg-emerald-50 text-emerald-800 border-emerald-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  refunded: "bg-slate-100 text-slate-700 border-slate-200",
};

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export function PaymentsPanel({ actorRole }: { actorRole: string }) {
  const role = actorRole.toLowerCase();
  const canRefund = ["super_admin", "admin"].includes(role);
  const qc = useQueryClient();

  const [status, setStatus] = useState("");
  const [processed, setProcessed] = useState("");
  const [search, setSearch] = useState("");
  const [searchApplied, setSearchApplied] = useState("");
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ["staff", "payments", status, processed, searchApplied, page],
    queryFn: () =>
      listStaffPayments({
        page,
        limit: 20,
        status: status || undefined,
        processed: processed || undefined,
        search: searchApplied || undefined,
      }),
    refetchInterval: 15_000,
  });

  const refundMutation = useMutation({
    mutationFn: (row: StaffPaymentRow) =>
      refundStaffPayment(row.txRef, "Staff refund from payments panel"),
    onSuccess: () => {
      toast.success("Refund initiated");
      void qc.invalidateQueries({ queryKey: ["staff", "payments"] });
      void qc.invalidateQueries({ queryKey: ["staff", "stats"] });
    },
    onError: (err) => toastApiError(err, "Refund failed"),
  });

  const items = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--brand-blue)]">
            Transactions
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Payment ledger
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Monitor Chapa checkouts, fulfillment, and refunds. Auto-refreshes
            every 15s.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl font-bold"
          onClick={() => void query.refetch()}
          disabled={query.isFetching}
        >
          <RefreshCw
            className={`mr-1.5 h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.id || "all"}
            type="button"
            onClick={() => {
              setStatus(f.id);
              setPage(1);
            }}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
              status === f.id
                ? "bg-[var(--brand-blue)] text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {f.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setProcessed(processed === "false" ? "" : "false");
            setPage(1);
          }}
          className={`rounded-xl px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
            processed === "false"
              ? "bg-amber-500 text-white"
              : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
          }`}
        >
          Unprocessed
        </button>
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setSearchApplied(search.trim());
          setPage(1);
        }}
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tx ref, email, name, auction…"
            className="pl-9"
          />
        </div>
        <Button type="submit" className="font-bold">
          Search
        </Button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {query.isLoading ? (
          <p className="py-16 text-center text-sm text-slate-500">
            Loading payments…
          </p>
        ) : !items.length ? (
          <div className="flex flex-col items-center gap-2 py-16 text-slate-500">
            <Wallet className="h-8 w-8 text-slate-300" />
            <p className="text-sm font-medium">No payments match this filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Tx / Chapa</th>
                  <th className="px-4 py-3">Participant</th>
                  <th className="px-4 py-3">Auction</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((p) => (
                  <tr key={p.id} className="align-top">
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs font-semibold text-slate-800">
                        {p.txRef}
                      </p>
                      {p.chapaReference ? (
                        <p className="mt-0.5 font-mono text-[10px] text-slate-400">
                          {p.chapaReference}
                        </p>
                      ) : null}
                      {p.lastError ? (
                        <p className="mt-1 max-w-[220px] text-[11px] leading-snug text-red-600">
                          {p.lastError}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">
                        {p.participantName || "—"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {p.participantEmail || ""}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {p.auctionTitle || "—"}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {p.amount} ETB
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${
                          STATUS_BADGE[p.status] || STATUS_BADGE.pending
                        }`}
                      >
                        {p.status}
                      </span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {!p.processed && p.status === "success" ? (
                          <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                            unprocessed
                          </span>
                        ) : null}
                        {p.hasParticipation ? (
                          <span className="rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold text-sky-800">
                            joined
                          </span>
                        ) : null}
                        {p.refundStatus ? (
                          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                            refund:{p.refundStatus}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {formatWhen(p.updatedAt)}
                    </td>
                    <td className="px-4 py-3">
                      {canRefund && p.canRefund ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-lg text-xs font-bold text-red-700"
                          disabled={refundMutation.isPending}
                          onClick={() => {
                            if (
                              window.confirm(
                                `Refund ${p.amount} ETB for ${p.txRef}?`
                              )
                            ) {
                              refundMutation.mutate(p);
                            }
                          }}
                        >
                          Refund
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pages > 1 ? (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>
            Page {page} of {pages} · {total} total
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={page >= pages}
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

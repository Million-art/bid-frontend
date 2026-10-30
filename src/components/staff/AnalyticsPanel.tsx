"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  CircleDollarSign,
  Gavel,
  Ticket,
  Users,
  AlertTriangle,
  Clock,
} from "lucide-react";
import {
  getStaffDashboardCharts,
  getStaffDashboardStats,
  type StaffChartSeries,
} from "@/services/staff.service";

function formatEtb(n: number): string {
  return new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: "ETB",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

function MiniBars({
  series,
  color = "bg-[var(--brand-blue)]",
}: {
  series: StaffChartSeries;
  color?: string;
}) {
  const max = Math.max(1, ...series.values);
  if (!series.labels.length) {
    return (
      <p className="py-10 text-center text-sm text-slate-400">No data yet</p>
    );
  }
  return (
    <div className="flex h-44 items-end gap-1.5 pt-2">
      {series.values.map((v, i) => (
        <div
          key={series.labels[i] || i}
          className="group relative flex min-w-0 flex-1 flex-col items-center justify-end"
          title={`${series.labels[i]}: ${v}`}
        >
          <div
            className={`w-full max-w-[28px] rounded-t-md ${color} transition-all`}
            style={{ height: `${Math.max(4, (v / max) * 100)}%` }}
          />
          <span className="mt-1.5 max-w-full truncate text-[9px] font-semibold text-slate-400">
            {series.labels[i]?.split(" ")[0]}
          </span>
        </div>
      ))}
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "default" | "warn" | "danger" | "ok";
}) {
  const toneCls =
    tone === "warn"
      ? "border-amber-200 bg-amber-50/80"
      : tone === "danger"
        ? "border-red-200 bg-red-50/80"
        : tone === "ok"
          ? "border-emerald-200 bg-emerald-50/70"
          : "border-slate-200 bg-white";
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${toneCls}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          {label}
        </p>
        <Icon className="h-4 w-4 text-slate-400" />
      </div>
      <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function AnalyticsPanel() {
  const statsQuery = useQuery({
    queryKey: ["staff", "stats"],
    queryFn: getStaffDashboardStats,
    refetchInterval: 30_000,
  });
  const chartsQuery = useQuery({
    queryKey: ["staff", "charts"],
    queryFn: getStaffDashboardCharts,
    refetchInterval: 60_000,
  });

  const s = statsQuery.data;
  const c = chartsQuery.data;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--brand-blue)]">
          Analytics
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Revenue &amp; activity
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">
          Live ledger totals, payment health, and 12-month trends across
          customers, participations, and bids.
        </p>
      </div>

      {statsQuery.isLoading ? (
        <p className="text-sm text-slate-500">Loading stats…</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi
            label="Total revenue"
            value={formatEtb(s?.totalRevenue ?? 0)}
            hint="Successful Chapa payments"
            icon={CircleDollarSign}
            tone="ok"
          />
          <Kpi
            label="Pending Chapa"
            value={formatEtb(s?.pendingRevenue ?? 0)}
            hint={`${s?.paymentsPending ?? 0} open checkouts`}
            icon={Clock}
            tone={(s?.paymentsPending ?? 0) > 0 ? "warn" : "default"}
          />
          <Kpi
            label="Customers"
            value={String(s?.totalParticipants ?? 0)}
            hint={`${s?.participationsTotal ?? 0} participations`}
            icon={Users}
          />
          <Kpi
            label="Active auctions"
            value={String(s?.activeAuctionsCount ?? 0)}
            hint={`${s?.totalAuctions ?? 0} total · ${s?.executedAuctionsCount ?? 0} executed`}
            icon={Gavel}
          />
        </div>
      )}

      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
          Transaction monitoring
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Kpi
            label="Success"
            value={String(s?.paymentsSuccess ?? 0)}
            icon={Ticket}
            tone="ok"
          />
          <Kpi
            label="Failed"
            value={String(s?.paymentsFailed ?? 0)}
            icon={AlertTriangle}
            tone={(s?.paymentsFailed ?? 0) > 0 ? "danger" : "default"}
          />
          <Kpi
            label="Pending"
            value={String(s?.paymentsPending ?? 0)}
            icon={Clock}
            tone={(s?.paymentsPending ?? 0) > 0 ? "warn" : "default"}
          />
          <Kpi
            label="Unprocessed"
            value={String(s?.paymentsUnprocessed ?? 0)}
            hint="Paid but not fulfilled"
            icon={AlertTriangle}
            tone={(s?.paymentsUnprocessed ?? 0) > 0 ? "warn" : "default"}
          />
          <Kpi
            label="Refunded"
            value={String(s?.paymentsRefunded ?? 0)}
            icon={CircleDollarSign}
          />
        </div>
      </div>

      {chartsQuery.isLoading ? (
        <p className="text-sm text-slate-500">Loading charts…</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {(
            [
              {
                title: "Revenue (ETB)",
                series: c?.revenue,
                color: "bg-emerald-500",
                icon: CircleDollarSign,
              },
              {
                title: "New customers",
                series: c?.userGrowth,
                color: "bg-[var(--brand-blue)]",
                icon: Users,
              },
              {
                title: "Participations",
                series: c?.participations,
                color: "bg-sky-500",
                icon: Ticket,
              },
              {
                title: "Bids placed",
                series: c?.bids,
                color: "bg-violet-500",
                icon: Gavel,
              },
            ] as const
          ).map(({ title, series, color, icon: Icon }) => (
            <div
              key={title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-slate-400" />
                <Icon className="h-4 w-4 text-slate-400" />
                <h2 className="text-sm font-bold text-slate-800">{title}</h2>
              </div>
              <MiniBars series={series || { labels: [], values: [] }} color={color} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

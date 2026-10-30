import { apiFetch, getApiBase, getCsrfToken, type ApiResponse } from "@/lib/api";
import {
  AuctionParticipationSchema,
  AuctionSchema,
  AuctionsListSchema,
  BidSchema,
  type Auction,
  type AuctionParticipation,
  type AuctionsList,
  type Bid,
} from "@/lib/schemas";

export interface StaffAuctionPayload {
  title: string;
  description?: string;
  imageUrl?: string;
  imageUrls?: string[];
  videoUrl?: string;
  entranceFee: number;
  retailValue?: number;
  minParticipants?: number;
  minBidValue?: number;
  maxBidValue?: number | null;
  startAt?: string | null;
  closeAt?: string | null;
}

export interface DrawResult {
  WinnerBidID?: string;
  WinnerParticipant?: string;
  WinnerBidValue?: number;
  HasWinner?: boolean;
  winnerBidId?: string;
  winnerParticipant?: string;
  winnerBidValue?: number;
  hasWinner?: boolean;
}

function unwrapData(payload: unknown): unknown {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: unknown }).data;
  }
  return payload;
}

export async function listStaffAuctions(params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}): Promise<AuctionsList> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  const qs = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (params?.status) qs.set("status", params.status);
  if (params?.search) qs.set("search", params.search);

  const res = await apiFetch<ApiResponse<unknown>>(
    `/api/auctions?${qs.toString()}`
  );
  const raw = unwrapData(res) ?? res.data ?? res;
  const parsed = AuctionsListSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  if (raw && typeof raw === "object" && "items" in raw) {
    const obj = raw as { items?: unknown[]; total?: number };
    const items = Array.isArray(obj.items)
      ? obj.items
          .map((item) => AuctionSchema.safeParse(item))
          .filter((r) => r.success)
          .map((r) => r.data)
      : [];
    return {
      items,
      total: Number(obj.total ?? items.length),
      page,
      limit,
    };
  }
  return { items: [], total: 0, page, limit };
}

export async function createStaffAuction(
  payload: StaffAuctionPayload
): Promise<Auction> {
  const res = await apiFetch<ApiResponse<unknown>>("/api/auctions/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const raw = unwrapData(res);
  return AuctionSchema.parse(raw);
}

export async function updateStaffAuction(
  id: string,
  payload: Partial<StaffAuctionPayload>
): Promise<Auction> {
  const res = await apiFetch<ApiResponse<unknown>>(
    `/api/auctions/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
  const raw = unwrapData(res);
  return AuctionSchema.parse(raw);
}

export async function activateStaffAuction(id: string): Promise<void> {
  await apiFetch<ApiResponse<unknown>>(
    `/api/auctions/${encodeURIComponent(id)}/activate`,
    { method: "POST" }
  );
}

export async function postponeStaffAuction(
  id: string,
  newCloseAtIso: string
): Promise<void> {
  await apiFetch<ApiResponse<unknown>>(
    `/api/auctions/${encodeURIComponent(id)}/postpone`,
    {
      method: "POST",
      body: JSON.stringify({ newCloseAt: newCloseAtIso }),
    }
  );
}

export async function closeStaffAuction(id: string): Promise<void> {
  await apiFetch<ApiResponse<unknown>>(
    `/api/auctions/${encodeURIComponent(id)}/close`,
    { method: "POST" }
  );
}

export async function cancelStaffAuction(id: string): Promise<void> {
  await apiFetch<ApiResponse<unknown>>(
    `/api/auctions/${encodeURIComponent(id)}/cancel`,
    { method: "POST" }
  );
}

export async function executeStaffAuctionDraw(
  id: string
): Promise<{ message?: string; result: DrawResult }> {
  const res = await apiFetch<ApiResponse<DrawResult>>(
    `/api/auctions/${encodeURIComponent(id)}/execute-draw`,
    { method: "POST" }
  );
  return {
    message: res.message,
    result: (unwrapData(res) ?? {}) as DrawResult,
  };
}

export async function listStaffAuctionParticipants(
  auctionId: string,
  params?: { page?: number; limit?: number }
): Promise<{ items: AuctionParticipation[]; total: number }> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 50;
  const qs = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  const res = await apiFetch<ApiResponse<unknown>>(
    `/api/auctions/${encodeURIComponent(auctionId)}/participants?${qs.toString()}`
  );
  const raw = (unwrapData(res) ?? {}) as { items?: unknown[]; total?: number };
  const items = Array.isArray(raw.items)
    ? raw.items
        .map((x) => AuctionParticipationSchema.safeParse(x))
        .filter((r) => r.success)
        .map((r) => r.data)
    : [];
  return { items, total: Number(raw.total ?? items.length) };
}

export async function listStaffAuctionBids(
  auctionId: string,
  params?: { page?: number; limit?: number }
): Promise<{ items: Bid[]; total: number }> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 100;
  const qs = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  const res = await apiFetch<ApiResponse<unknown>>(
    `/api/auctions/${encodeURIComponent(auctionId)}/bids?${qs.toString()}`
  );
  const raw = (unwrapData(res) ?? {}) as { items?: unknown[]; total?: number };
  const items = Array.isArray(raw.items)
    ? raw.items
        .map((x) => BidSchema.safeParse(x))
        .filter((r) => r.success)
        .map((r) => r.data)
    : [];
  return { items, total: Number(raw.total ?? items.length) };
}

export type StaffUserRole = "super_admin" | "admin" | "compliance";
export type StaffUserStatus = "active" | "suspended" | "pending";

export interface StaffUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ParticipantCustomer {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  status: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedList<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

function parsePaginatedList<T>(
  raw: unknown,
  page: number,
  limit: number,
  mapItem: (item: unknown) => T | null
): PaginatedList<T> {
  const obj =
    raw && typeof raw === "object"
      ? (raw as { items?: unknown[]; total?: number; page?: number; limit?: number })
      : {};
  const items = Array.isArray(obj.items)
    ? obj.items.map(mapItem).filter((x): x is T => x != null)
    : [];
  return {
    items,
    total: Number(obj.total ?? items.length),
    page: Number(obj.page ?? page),
    limit: Number(obj.limit ?? limit),
  };
}

function mapStaffUser(raw: unknown): StaffUser | null {
  if (!raw || typeof raw !== "object") return null;
  const u = raw as Record<string, unknown>;
  if (!u.id || !u.email) return null;
  return {
    id: String(u.id),
    fullName: String(u.fullName ?? ""),
    email: String(u.email),
    phone: u.phone != null ? String(u.phone) : undefined,
    role: String(u.role ?? ""),
    status: String(u.status ?? "active"),
    createdAt: u.createdAt != null ? String(u.createdAt) : undefined,
    updatedAt: u.updatedAt != null ? String(u.updatedAt) : undefined,
  };
}

function mapParticipant(raw: unknown): ParticipantCustomer | null {
  if (!raw || typeof raw !== "object") return null;
  const u = raw as Record<string, unknown>;
  if (!u.id) return null;
  return {
    id: String(u.id),
    fullName: String(u.fullName ?? ""),
    email: String(u.email ?? ""),
    phone: u.phone != null ? String(u.phone) : undefined,
    status: String(u.status ?? "active"),
    role: u.role != null ? String(u.role) : "participant",
    createdAt: u.createdAt != null ? String(u.createdAt) : undefined,
    updatedAt: u.updatedAt != null ? String(u.updatedAt) : undefined,
  };
}

export async function listStaffUsers(params?: {
  page?: number;
  limit?: number;
  roles?: string;
  status?: string;
  search?: string;
}): Promise<PaginatedList<StaffUser>> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  const qs = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    roles: params?.roles ?? "super_admin,admin,compliance",
  });
  if (params?.status) qs.set("status", params.status);
  if (params?.search?.trim()) qs.set("search", params.search.trim());

  const res = await apiFetch<ApiResponse<unknown>>(
    `/api/users?${qs.toString()}`
  );
  return parsePaginatedList(
    unwrapData(res) ?? res.data ?? res,
    page,
    limit,
    mapStaffUser
  );
}

export async function createStaffUser(payload: {
  fullName: string;
  email: string;
  phone?: string;
  role: "admin" | "compliance";
}): Promise<StaffUser> {
  const res = await apiFetch<ApiResponse<unknown>>("/api/users/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const raw = unwrapData(res) ?? res.data ?? res;
  const mapped = mapStaffUser(raw);
  if (!mapped) throw new Error("Invalid user response");
  return mapped;
}

export async function updateStaffUserStatus(
  id: string,
  status: StaffUserStatus
): Promise<void> {
  await apiFetch(`/api/users/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function deleteStaffUser(id: string): Promise<void> {
  await apiFetch(`/api/users/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function listParticipants(params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}): Promise<PaginatedList<ParticipantCustomer>> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  const qs = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (params?.status) qs.set("status", params.status);
  if (params?.search?.trim()) qs.set("search", params.search.trim());

  const res = await apiFetch<ApiResponse<unknown>>(
    `/api/participants?${qs.toString()}`
  );
  return parsePaginatedList(
    unwrapData(res) ?? res.data ?? res,
    page,
    limit,
    mapParticipant
  );
}

export async function updateParticipantStatus(
  id: string,
  status: "active" | "suspended"
): Promise<void> {
  await apiFetch(`/api/participants/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function deleteParticipant(id: string): Promise<void> {
  await apiFetch(`/api/participants/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export type TelegramBroadcastTarget = "channel" | "bot" | "admin";
export type TelegramMediaType = "none" | "photo" | "video" | "animation";

export interface TelegramBroadcastPayload {
  target: TelegramBroadcastTarget;
  text?: string;
  mediaType?: TelegramMediaType;
  fileId?: string;
  buttonText?: string;
  buttonUrl?: string;
}

export interface TelegramBroadcastStats {
  botAudience: number;
  botConfigured: boolean;
  adminConfigured: boolean;
}

export interface TelegramBroadcastResult {
  target: string;
  sent: number;
  failed: number;
  skipped: number;
  audience: number;
}

export interface StaffDashboardStats {
  totalAuctions: number;
  totalParticipants: number;
  totalRevenue: number;
  pendingRevenue: number;
  statusBreakdown: Record<string, number>;
  pendingAuctionsCount: number;
  activeAuctionsCount: number;
  executedAuctionsCount: number;
  paymentsSuccess: number;
  paymentsFailed: number;
  paymentsPending: number;
  paymentsRefunded: number;
  paymentsUnprocessed: number;
  participationsTotal: number;
}

export interface StaffChartSeries {
  labels: string[];
  values: number[];
}

export interface StaffDashboardCharts {
  revenue: StaffChartSeries;
  userGrowth: StaffChartSeries;
  participations: StaffChartSeries;
  bids: StaffChartSeries;
  payments: StaffChartSeries;
}

export interface StaffPaymentRow {
  id: string;
  txRef: string;
  chapaReference?: string;
  amount: string;
  status: string;
  processed: boolean;
  retryDisabled: boolean;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
  participantName?: string;
  participantEmail?: string;
  auctionTitle?: string;
  hasParticipation: boolean;
  refundStatus?: string;
  canRefund: boolean;
  userId?: string;
  auctionId?: string;
  participationId?: string;
}

function emptyChart(): StaffChartSeries {
  return { labels: [], values: [] };
}

function parseChart(raw: unknown): StaffChartSeries {
  if (!raw || typeof raw !== "object") return emptyChart();
  const o = raw as { labels?: unknown; values?: unknown };
  const labels = Array.isArray(o.labels) ? o.labels.map(String) : [];
  const values = Array.isArray(o.values)
    ? o.values.map((v) => Number(v) || 0)
    : [];
  return { labels, values };
}

export async function getStaffDashboardStats(): Promise<StaffDashboardStats> {
  const res = await apiFetch<ApiResponse<StaffDashboardStats>>("/api/stats");
  const raw = (unwrapData(res) ?? res.data ?? {}) as Partial<StaffDashboardStats>;
  return {
    totalAuctions: Number(raw.totalAuctions ?? 0),
    totalParticipants: Number(raw.totalParticipants ?? 0),
    totalRevenue: Number(raw.totalRevenue ?? 0),
    pendingRevenue: Number(raw.pendingRevenue ?? 0),
    statusBreakdown: (raw.statusBreakdown as Record<string, number>) || {},
    pendingAuctionsCount: Number(raw.pendingAuctionsCount ?? 0),
    activeAuctionsCount: Number(raw.activeAuctionsCount ?? 0),
    executedAuctionsCount: Number(raw.executedAuctionsCount ?? 0),
    paymentsSuccess: Number(raw.paymentsSuccess ?? 0),
    paymentsFailed: Number(raw.paymentsFailed ?? 0),
    paymentsPending: Number(raw.paymentsPending ?? 0),
    paymentsRefunded: Number(raw.paymentsRefunded ?? 0),
    paymentsUnprocessed: Number(raw.paymentsUnprocessed ?? 0),
    participationsTotal: Number(raw.participationsTotal ?? 0),
  };
}

export async function getStaffDashboardCharts(): Promise<StaffDashboardCharts> {
  const res = await apiFetch<ApiResponse<StaffDashboardCharts>>("/api/stats/charts");
  const raw = (unwrapData(res) ?? res.data ?? {}) as Partial<StaffDashboardCharts>;
  return {
    revenue: parseChart(raw.revenue),
    userGrowth: parseChart(raw.userGrowth),
    participations: parseChart(raw.participations),
    bids: parseChart(raw.bids),
    payments: parseChart(raw.payments),
  };
}

export async function listStaffPayments(params?: {
  page?: number;
  limit?: number;
  status?: string;
  processed?: string;
  search?: string;
}): Promise<{ items: StaffPaymentRow[]; total: number; page: number; limit: number }> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  const qs = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (params?.status) qs.set("status", params.status);
  if (params?.processed) qs.set("processed", params.processed);
  if (params?.search) qs.set("search", params.search);

  const res = await apiFetch<
    ApiResponse<{ items?: StaffPaymentRow[]; total?: number; page?: number; limit?: number }>
  >(`/api/payments?${qs.toString()}`);
  const raw = (unwrapData(res) ?? res.data ?? {}) as {
    items?: StaffPaymentRow[];
    total?: number;
    page?: number;
    limit?: number;
  };
  return {
    items: Array.isArray(raw.items) ? raw.items : [],
    total: Number(raw.total ?? 0),
    page: Number(raw.page ?? page),
    limit: Number(raw.limit ?? limit),
  };
}

export async function refundStaffPayment(
  txRef: string,
  reason?: string
): Promise<void> {
  await apiFetch(`/api/payments/${encodeURIComponent(txRef)}/refund`, {
    method: "POST",
    body: JSON.stringify({ reason: reason || "" }),
  });
}

export async function getTelegramBroadcastStats(): Promise<TelegramBroadcastStats> {
  const res = await apiFetch<ApiResponse<TelegramBroadcastStats>>(
    "/api/telegram/broadcast/stats"
  );
  const raw = (unwrapData(res) ?? res.data ?? {}) as Partial<TelegramBroadcastStats>;
  return {
    botAudience: Number(raw.botAudience ?? 0),
    botConfigured: Boolean(raw.botConfigured),
    adminConfigured: Boolean(raw.adminConfigured),
  };
}

export async function sendTelegramBroadcast(
  payload: TelegramBroadcastPayload
): Promise<TelegramBroadcastResult> {
  const res = await apiFetch<ApiResponse<TelegramBroadcastResult>>(
    "/api/telegram/broadcast",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
  const raw = (unwrapData(res) ?? res.data ?? {}) as Partial<TelegramBroadcastResult>;
  return {
    target: String(raw.target ?? payload.target),
    sent: Number(raw.sent ?? 0),
    failed: Number(raw.failed ?? 0),
    skipped: Number(raw.skipped ?? 0),
    audience: Number(raw.audience ?? 0),
  };
}

export async function uploadStaffMedia(file: File): Promise<{ url: string }> {
  const token = await getCsrfToken();
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${getApiBase()}/api/media/upload`, {
    method: "POST",
    credentials: "include",
    headers: token ? { "X-CSRF-Token": token } : undefined,
    body: formData,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => null);
    const msg =
      errBody && typeof errBody === "object" && "message" in errBody
        ? String((errBody as { message: unknown }).message)
        : `Upload failed (${res.status})`;
    throw new Error(msg);
  }

  const body = (await res.json()) as ApiResponse<{ url?: string }>;
  const data = unwrapData(body) as { url?: string } | null;
  if (!data?.url) {
    throw new Error("Upload succeeded but no URL was returned");
  }
  return { url: data.url };
}

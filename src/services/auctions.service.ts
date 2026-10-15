import { apiFetch, type ApiResponse } from "@/lib/api";
import {
  BidEntrySchema,
  LubParticipationSchema,
  LubProductSchema,
  LubProductsListSchema,
  type BidEntry,
  type LubParticipation,
  type LubProduct,
  type LubProductsList,
} from "@/lib/schemas";

export type { BidEntry, LubParticipation, LubProduct, LubProductsList };

function unwrapData<T>(payload: unknown): unknown {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: unknown }).data;
  }
  return payload;
}

export async function listAuctions(params?: {
  page?: number;
  limit?: number;
}): Promise<LubProductsList> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  const qs = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  const res = await apiFetch<ApiResponse<unknown>>(
    `/api/lub-products?${qs.toString()}`
  );
  const raw = unwrapData(res) ?? res.data ?? res;
  const parsed = LubProductsListSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  // Fallback if API returns a bare array
  if (Array.isArray(raw)) {
    return {
      items: raw
        .map((item) => LubProductSchema.safeParse(item))
        .filter((r) => r.success)
        .map((r) => r.data),
      total: raw.length,
      page,
      limit,
    };
  }
  return { items: [], total: 0, page, limit };
}

export async function getAuction(id: string): Promise<LubProduct> {
  const res = await apiFetch<ApiResponse<unknown>>(`/api/lub-products/${id}`);
  const raw = unwrapData(res) ?? res.data ?? res;
  return LubProductSchema.parse(raw);
}

export interface ParticipateResult {
  checkoutUrl?: string;
  participation?: LubParticipation;
  message?: string;
}

/** Pay entrance fee (wallet or Chapa checkout via client-backend). */
export async function participateInAuction(
  productId: string,
  options?: { useWallet?: boolean; checkoutUrl?: string }
): Promise<ParticipateResult> {
  const body: Record<string, unknown> = {};
  if (options?.useWallet) body.useWallet = true;
  if (options?.checkoutUrl) body.checkoutUrl = options.checkoutUrl;

  const res = await apiFetch<ApiResponse<ParticipateResult>>(
    `/api/lub-products/${productId}/participate`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
  return (res.data ?? res) as ParticipateResult;
}

export async function placeBid(
  productId: string,
  bidValue: number
): Promise<BidEntry> {
  const res = await apiFetch<ApiResponse<unknown>>(`/api/lub-bids`, {
    method: "POST",
    body: JSON.stringify({ productId, bidValue }),
  });
  const raw = unwrapData(res) ?? res.data ?? res;
  return BidEntrySchema.parse(raw);
}

export async function updateBid(
  bidId: string,
  newBidValue: number
): Promise<BidEntry> {
  const res = await apiFetch<ApiResponse<unknown>>(`/api/lub-bids/${bidId}`, {
    method: "PATCH",
    body: JSON.stringify({ newBidValue }),
  });
  const raw = unwrapData(res) ?? res.data ?? res;
  return BidEntrySchema.parse(raw);
}

export async function getMyBids(productId: string): Promise<BidEntry[]> {
  const res = await apiFetch<ApiResponse<unknown>>(
    `/api/lub-products/${productId}/my-bids`
  );
  const raw = unwrapData(res) ?? res.data ?? res;
  if (Array.isArray(raw)) {
    return raw
      .map((item) => BidEntrySchema.safeParse(item))
      .filter((r) => r.success)
      .map((r) => r.data);
  }
  return [];
}

export async function getMyParticipation(
  productId: string
): Promise<{ participating: boolean; participation?: LubParticipation }> {
  const res = await apiFetch<ApiResponse<unknown>>(
    `/api/lub-products/${productId}/my-participation`
  );
  const raw = (unwrapData(res) ?? res.data ?? res) as Record<string, unknown>;
  if (raw && typeof raw === "object") {
    const participating = Boolean(raw.participating);
    let participation: LubParticipation | undefined;
    if (raw.participation) {
      const parsed = LubParticipationSchema.safeParse(raw.participation);
      if (parsed.success) participation = parsed.data;
    }
    return { participating, participation };
  }
  return { participating: false };
}

export async function listMyParticipations(params?: {
  page?: number;
  limit?: number;
}): Promise<{
  items: Array<{
    product: LubProduct;
    participation: LubParticipation;
    bids?: BidEntry[];
  }>;
  total: number;
}> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  const qs = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  try {
    const res = await apiFetch<ApiResponse<unknown>>(
      `/api/me/lub-participations?${qs.toString()}`
    );
    const raw = (unwrapData(res) ?? res.data ?? res) as {
      items?: unknown[];
      total?: number;
    };
    const items = Array.isArray(raw?.items)
      ? raw.items
          .map((row) => {
            const r = row as Record<string, unknown>;
            const product = LubProductSchema.safeParse(r.product ?? r);
            const participation = LubParticipationSchema.safeParse(
              r.participation ?? r
            );
            if (!product.success || !participation.success) return null;
            return {
              product: product.data,
              participation: participation.data,
              bids: Array.isArray(r.bids)
                ? r.bids
                    .map((b) => BidEntrySchema.safeParse(b))
                    .filter((x) => x.success)
                    .map((x) => x.data)
                : undefined,
            };
          })
          .filter(Boolean) as Array<{
          product: LubProduct;
          participation: LubParticipation;
          bids?: BidEntry[];
        }>
      : [];
    return { items, total: raw?.total ?? items.length };
  } catch {
    return { items: [], total: 0 };
  }
}

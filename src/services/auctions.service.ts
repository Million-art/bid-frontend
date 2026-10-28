import { apiFetch, type ApiResponse } from "@/lib/api";
import {
  AuctionAuditSchema,
  AuctionParticipationSchema,
  AuctionSchema,
  PublicAuctionCardSchema,
  PublicAuctionsListSchema,
  BidSchema,
  type Auction,
  type AuctionAudit,
  type AuctionAuditEntry,
  type AuctionParticipation,
  type Bid,
  type PublicAuctionCard,
  type PublicAuctionsList,
} from "@/lib/schemas";

export type {
  Auction,
  AuctionAudit,
  AuctionAuditEntry,
  AuctionParticipation,
  Bid,
  PublicAuctionCard,
  PublicAuctionsList,
};

function unwrapData(payload: unknown): unknown {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: unknown }).data;
  }
  return payload;
}

/** Public list  strips any bid fields that may appear in the payload. */
export async function listAuctions(params?: {
  page?: number;
  limit?: number;
}): Promise<PublicAuctionsList> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  const qs = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  const res = await apiFetch<ApiResponse<unknown>>(
    `/api/public/auctions?${qs.toString()}`
  );
  const raw = unwrapData(res) ?? res.data ?? res;
  const parsed = PublicAuctionsListSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  if (Array.isArray(raw)) {
    return {
      items: raw
        .map((item) => PublicAuctionCardSchema.safeParse(item))
        .filter((r) => r.success)
        .map((r) => r.data),
      total: raw.length,
      page,
      limit,
    };
  }
  return { items: [], total: 0, page, limit };
}

export async function getAuction(id: string): Promise<Auction> {
  const res = await apiFetch<ApiResponse<unknown>>(`/api/public/auctions/${id}`);
  const raw = unwrapData(res) ?? res.data ?? res;
  return AuctionSchema.parse(raw);
}

export async function getAuctionAudit(auctionId: string): Promise<AuctionAudit> {
  const res = await apiFetch<ApiResponse<unknown>>(
    `/api/public/auctions/${auctionId}/audit`
  );
  const raw = unwrapData(res) ?? res.data ?? res;
  return AuctionAuditSchema.parse(raw);
}

export interface ParticipateResult {
  checkoutUrl?: string;
  txRef?: string;
  participating?: boolean;
  participation?: AuctionParticipation;
  bid?: Bid;
  message?: string;
}

export interface VerifyPaymentResult {
  verified: boolean;
  status?: string;
  txRef?: string;
  auctionId?: string;
  participating?: boolean;
  participation?: AuctionParticipation;
  bids?: Bid[];
}

/** Pay entrance fee × ticket count & place bid pack via Chapa checkout. */
export async function participateInAuction(
  auctionId: string,
  options?: {
    bidValue?: number;
    bidValues?: number[];
    returnUrl?: string;
    checkoutUrl?: string;
  }
): Promise<ParticipateResult> {
  const body: Record<string, unknown> = {};
  if (options?.bidValues && options.bidValues.length > 0) {
    body.bidValues = options.bidValues;
  } else if (options?.bidValue && options.bidValue > 0) {
    body.bidValue = options.bidValue;
  }
  if (options?.returnUrl) body.returnUrl = options.returnUrl;
  if (options?.checkoutUrl) body.checkoutUrl = options.checkoutUrl;

  const res = await apiFetch<ApiResponse<ParticipateResult>>(
    `/api/public/auctions/${auctionId}/participate`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
  return (res.data ?? res) as ParticipateResult;
}

/** Verify Chapa transaction after return from checkout. */
export async function verifyChapaPayment(
  txRef: string,
  bidValueOrValues?: number | number[]
): Promise<VerifyPaymentResult> {
  const body: Record<string, unknown> = { txRef };
  if (Array.isArray(bidValueOrValues) && bidValueOrValues.length > 0) {
    body.bidValues = bidValueOrValues;
  } else if (typeof bidValueOrValues === "number" && bidValueOrValues > 0) {
    body.bidValue = bidValueOrValues;
  }

  const res = await apiFetch<ApiResponse<VerifyPaymentResult>>(
    `/api/public/payments/verify`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
  return (res.data ?? res) as VerifyPaymentResult;
}

export async function placeBid(
  auctionId: string,
  bidValue: number
): Promise<Bid> {
  const res = await apiFetch<ApiResponse<unknown>>(`/api/public/bids`, {
    method: "POST",
    body: JSON.stringify({ auctionId, bidValue }),
  });
  const raw = unwrapData(res) ?? res.data ?? res;
  return BidSchema.parse(raw);
}

export async function updateBid(
  bidId: string,
  newBidValue: number
): Promise<Bid> {
  const res = await apiFetch<ApiResponse<unknown>>(`/api/public/bids/${bidId}`, {
    method: "PATCH",
    body: JSON.stringify({ newBidValue }),
  });
  const raw = unwrapData(res) ?? res.data ?? res;
  return BidSchema.parse(raw);
}

export async function getMyBids(auctionId: string): Promise<Bid[]> {
  const res = await apiFetch<ApiResponse<unknown>>(
    `/api/public/auctions/${auctionId}/my-bids`
  );
  const raw = unwrapData(res) ?? res.data ?? res;
  if (Array.isArray(raw)) {
    return raw
      .map((item) => BidSchema.safeParse(item))
      .filter((r) => r.success)
      .map((r) => r.data);
  }
  return [];
}

export async function getMyParticipation(
  auctionId: string
): Promise<{ participating: boolean; participation?: AuctionParticipation }> {
  const res = await apiFetch<ApiResponse<unknown>>(
    `/api/public/auctions/${auctionId}/my-participation`
  );
  const raw = (unwrapData(res) ?? res.data ?? res) as Record<string, unknown>;
  if (raw && typeof raw === "object") {
    const participating = Boolean(raw.participating);
    let participation: AuctionParticipation | undefined;
    if (raw.participation) {
      const parsed = AuctionParticipationSchema.safeParse(raw.participation);
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
    auction: Auction;
    participation: AuctionParticipation;
    bids?: Bid[];
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
      `/api/me/participations?${qs.toString()}`
    );
    const raw = (unwrapData(res) ?? res.data ?? res) as {
      items?: unknown[];
      total?: number;
    };
    const items = Array.isArray(raw?.items)
      ? raw.items
          .map((row) => {
            const r = row as Record<string, unknown>;
            const auction = AuctionSchema.safeParse(r.auction ?? r);
            const participation = AuctionParticipationSchema.safeParse(
              r.participation ?? r
            );
            if (!auction.success || !participation.success) return null;
            return {
              auction: auction.data,
              participation: participation.data,
              bids: Array.isArray(r.bids)
                ? r.bids
                    .map((b) => BidSchema.safeParse(b))
                    .filter((x) => x.success)
                    .map((x) => x.data)
                : undefined,
            };
          })
          .filter(Boolean) as Array<{
          auction: Auction;
          participation: AuctionParticipation;
          bids?: Bid[];
        }>
      : [];
    return { items, total: raw?.total ?? items.length };
  } catch {
    return { items: [], total: 0 };
  }
}

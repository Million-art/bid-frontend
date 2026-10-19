"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { queryKeys } from "@/lib/query-keys";
import { toastApiError } from "@/lib/toast-api-error";
import {
  participateInAuction,
  updateBid,
  verifyChapaPayment,
  type Auction,
  type Bid,
} from "@/services/auctions.service";

function isBidAlreadyUpdated(bid: Bid): boolean {
  if (bid.canUpdate === false) return true;
  if ((bid.updateCount ?? 0) >= 1) return true;
  if (bid.placedAt && bid.updatedAt) {
    const placed = new Date(bid.placedAt).getTime();
    const updated = new Date(bid.updatedAt).getTime();
    if (!Number.isNaN(placed) && !Number.isNaN(updated) && updated - placed > 100) {
      return true;
    }
  }
  return false;
}

export function BidPanel({
  auction,
  participating,
  myBids,
}: {
  auction: Auction;
  participating: boolean;
  myBids: Bid[];
}) {
  const { user } = useAuth();
  const { dict, formatCurrency, t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const [bidValue, setBidValue] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const verifiedRef = useRef<string | null>(null);

  const isOpen =
    auction.status === "active" || auction.status === "postponed";
  const canBid = (participating || myBids.length > 0) && isOpen;

  const invalidate = () => {
    void qc.invalidateQueries({
      queryKey: queryKeys.auctions.detail(auction.id),
    });
    void qc.invalidateQueries({
      queryKey: queryKeys.auctions.myBids(auction.id),
    });
    void qc.invalidateQueries({
      queryKey: queryKeys.auctions.myParticipation(auction.id),
    });
  };

  const verifyMutation = useMutation({
    mutationFn: ({ txRef, bidVal }: { txRef: string; bidVal?: number }) =>
      verifyChapaPayment(txRef, bidVal),
    onSuccess: (res) => {
      try {
        sessionStorage.removeItem(`carramarket_pending_chapa_${auction.id}`);
      } catch {
        // ignore storage errors
      }
      if (res.verified) {
        toast.success(dict.auctionDetail.paymentVerifiedSuccess);
      }
      invalidate();
      router.replace(`/auctions/${auction.id}`);
    },
    onError: (err) => {
      toastApiError(err, dict.auctionDetail.paymentVerifyError);
    },
  });

  useEffect(() => {
    const urlTxRef =
      searchParams.get("tx_ref") ||
      searchParams.get("trx_ref") ||
      searchParams.get("txRef");
    const urlBidRaw = searchParams.get("bid_value");
    let txRefToVerify = urlTxRef || "";
    let bidValToVerify = urlBidRaw ? Number.parseFloat(urlBidRaw) : undefined;

    if (!txRefToVerify) {
      try {
        const stored = sessionStorage.getItem(
          `carramarket_pending_chapa_${auction.id}`
        );
        if (stored) {
          const parsed = JSON.parse(stored) as {
            txRef?: string;
            bidValue?: number;
            ts?: number;
          };
          if (
            parsed.txRef &&
            (!parsed.ts || Date.now() - parsed.ts < 30 * 60 * 1000)
          ) {
            txRefToVerify = parsed.txRef;
            if (!bidValToVerify && parsed.bidValue) {
              bidValToVerify = parsed.bidValue;
            }
          }
        }
      } catch {
        // ignore
      }
    }

    if (txRefToVerify && verifiedRef.current !== txRefToVerify) {
      verifiedRef.current = txRefToVerify;
      verifyMutation.mutate({
        txRef: txRefToVerify,
        bidVal:
          bidValToVerify && Number.isFinite(bidValToVerify) && bidValToVerify > 0
            ? bidValToVerify
            : undefined,
      });
    }
  }, [auction.id, searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const validateBidAmount = (value: number): boolean => {
    if (!Number.isFinite(value) || value <= 0) {
      toast.error(dict.auctionDetail.invalidBidError);
      return false;
    }
    const min = auction.minBidValue ?? 0.01;
    if (value < min) {
      toast.error(`${dict.auctionDetail.bidRange}: ${formatCurrency(min)}+`);
      return false;
    }
    if (auction.maxBidValue != null && value > Number(auction.maxBidValue)) {
      toast.error(
        `${dict.auctionDetail.bidRange}: ${formatCurrency(min)} – ${formatCurrency(
          Number(auction.maxBidValue)
        )}`
      );
      return false;
    }
    return true;
  };

  const participateMutation = useMutation({
    mutationFn: (initialBid: number) => {
      const returnUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/auctions/${auction.id}`
          : undefined;
      return participateInAuction(auction.id, {
        bidValue: initialBid,
        returnUrl,
      });
    },
    onSuccess: (result, initialBid) => {
      if (result.checkoutUrl) {
        try {
          if (result.txRef) {
            sessionStorage.setItem(
              `carramarket_pending_chapa_${auction.id}`,
              JSON.stringify({
                txRef: result.txRef,
                bidValue: initialBid,
                ts: Date.now(),
              })
            );
          }
        } catch {
          // ignore storage errors
        }
        window.location.href = result.checkoutUrl;
        return;
      }
      toast.success(dict.auctionDetail.joinSuccess);
      setBidValue("");
      invalidate();
    },
    onError: (err) => toastApiError(err, dict.auctionDetail.joinError),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, value }: { id: string; value: number }) =>
      updateBid(id, value),
    onSuccess: () => {
      toast.success(dict.auctionDetail.bidUpdatedSuccess);
      setEditingId(null);
      invalidate();
    },
    onError: (err) => toastApiError(err, dict.auctionDetail.couldNotUpdateBid),
  });

  const requireLogin = () => {
    router.push(`/login?redirect=${encodeURIComponent(`/auctions/${auction.id}`)}`);
  };

  if (auction.status === "executed") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
          {dict.auctionDetail.auctionComplete}
        </p>
        {auction.winnerName && (
          <p className="mt-2 text-base font-bold text-slate-900">
            {dict.winners.winner}:{" "}
            <span className="text-emerald-800">{auction.winnerName}</span>
          </p>
        )}
        {auction.winnerBidValue != null ? (
          <p className="mt-1.5 text-lg font-bold text-slate-900">
            {t("auctionDetail.winningBid", {
              amount: formatCurrency(Number(auction.winnerBidValue)),
            })}
          </p>
        ) : (
          <p className="mt-2 text-sm text-slate-600">
            {dict.auctionDetail.resultsIn}
          </p>
        )}
      </div>
    );
  }

  if (auction.status === "cancelled") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
        {dict.auctionDetail.cancelled}
      </div>
    );
  }

  if (auction.status === "closed") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 text-sm text-amber-900">
        {dict.auctionDetail.biddingClosed}
      </div>
    );
  }

  return (
    <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {dict.auctionDetail.entranceFee}
        </p>
        <p className="text-2xl font-extrabold text-slate-900">
          {formatCurrency(auction.entranceFee)}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {dict.auctionDetail.bidRange}: {formatCurrency(auction.minBidValue ?? 0.01)}
          {auction.maxBidValue != null
            ? ` – ${formatCurrency(Number(auction.maxBidValue))}`
            : "+"}
        </p>
      </div>

      {verifyMutation.isPending && (
        <div className="flex items-center gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-900">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--brand-blue)] border-t-transparent" />
          {dict.auctionDetail.verifyingPayment}
        </div>
      )}

      {!user ? (
        <Button className="w-full h-12 font-bold" onClick={requireLogin}>
          {dict.auctionDetail.loginToJoin}
        </Button>
      ) : (
        <>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              const value = Number.parseFloat(bidValue);
              if (!validateBidAmount(value)) return;
              participateMutation.mutate(value);
            }}
          >
            <label className="block text-sm font-semibold text-slate-800">
              {dict.auctionDetail.yourBidValue}
            </label>
            <Input
              type="number"
              step="0.01"
              min={auction.minBidValue ?? 0.01}
              max={auction.maxBidValue ?? undefined}
              value={bidValue}
              onChange={(e) => setBidValue(e.target.value)}
              placeholder={dict.auctionDetail.bidPlaceholder}
              disabled={!isOpen || participateMutation.isPending}
            />
            <p className="text-xs text-slate-500">
              {dict.auctionDetail.oneUpdateNotice}
            </p>
            <Button
              type="submit"
              className="w-full h-12 font-bold"
              disabled={!isOpen || participateMutation.isPending}
            >
              {participateMutation.isPending
                ? dict.auctionDetail.redirectingToChapa
                : dict.auctionDetail.setBidAndPayChapa}
            </Button>
          </form>

          {myBids.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {dict.auctionDetail.yourBids}
                </p>
              </div>
              <ul className="space-y-2">
                {myBids.map((bid) => {
                  const alreadyUpdated = isBidAlreadyUpdated(bid);
                  return (
                    <li
                      key={bid.id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm"
                    >
                      {editingId === bid.id ? (
                        <form
                          className="flex w-full items-center gap-2"
                          onSubmit={(e) => {
                            e.preventDefault();
                            const value = Number.parseFloat(editValue);
                            if (!validateBidAmount(value)) return;
                            updateMutation.mutate({ id: bid.id, value });
                          }}
                        >
                          <Input
                            type="number"
                            step="0.01"
                            min={auction.minBidValue ?? 0.01}
                            max={auction.maxBidValue ?? undefined}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="h-9"
                          />
                          <Button
                            type="submit"
                            size="sm"
                            disabled={updateMutation.isPending}
                          >
                            {dict.common.save}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingId(null)}
                          >
                            {dict.common.cancel}
                          </Button>
                        </form>
                      ) : (
                        <>
                          <span className="font-bold text-slate-900">
                            {formatCurrency(bid.bidValue)}
                          </span>
                          {alreadyUpdated ? (
                            <span className="rounded-full bg-slate-200/80 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                              {dict.auctionDetail.bidUpdateUsedBadge}
                            </span>
                          ) : (
                            canBid && (
                              <button
                                type="button"
                                className="rounded-lg bg-[var(--brand-blue)]/10 px-2.5 py-1 text-xs font-semibold text-[var(--brand-blue)] transition hover:bg-[var(--brand-blue)]/20"
                                onClick={() => {
                                  setEditingId(bid.id);
                                  setEditValue(String(bid.bidValue));
                                }}
                              >
                                {dict.auctionDetail.updateBidOnceBtn}
                              </button>
                            )
                          )}
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

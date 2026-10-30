"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
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
import { AnalyticsEvents, track } from "@/lib/analytics";

const MAX_PACK = 10;

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

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
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
  const [draftValue, setDraftValue] = useState("");
  const [packTags, setPackTags] = useState<number[]>([]);
  const [packError, setPackError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const verifiedRef = useRef<string | null>(null);
  const draftRef = useRef<HTMLInputElement>(null);

  const isOpen =
    auction.status === "active" || auction.status === "postponed";
  const hasJoined = Boolean(user) && (participating || myBids.length > 0);
  const canBid = hasJoined && isOpen;
  const totalBidsCount = auction.totalBids ?? 0;
  const entranceFeeNum = Number(auction.entranceFee || 0);
  const draftAmountNum = roundMoney(Number.parseFloat(draftValue));
  const hasValidDraft =
    draftValue.trim() !== "" &&
    Number.isFinite(draftAmountNum) &&
    draftAmountNum > 0;
  const effectiveBids =
    packTags.length > 0 ? packTags : hasValidDraft ? [draftAmountNum] : [];
  const packBidsSum = roundMoney(
    effectiveBids.reduce((sum, val) => sum + Number(val || 0), 0)
  );
  const packEntranceSum = roundMoney(effectiveBids.length * entranceFeeNum);
  const packTotal = roundMoney(packEntranceSum + packBidsSum);
  const existingValues = new Set(
    myBids.map((b) => roundMoney(Number(b.bidValue)).toFixed(2))
  );

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

  const clearPendingChapa = () => {
    try {
      sessionStorage.removeItem(`carramarket_pending_chapa_${auction.id}`);
    } catch {
      /* ignore */
    }
  };

  const finishVerifyUI = (verified: boolean) => {
    clearPendingChapa();
    setPackTags([]);
    invalidate();
    router.replace(`/auctions/${auction.id}`);
    if (verified) {
      toast.success(dict.auctionDetail.paymentVerifiedSuccess);
    }
  };

  const verifyMutation = useMutation({
    mutationFn: ({
      txRef,
      bidValues,
    }: {
      txRef: string;
      bidValues?: number[];
    }) => {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 20000);
      return verifyChapaPayment(txRef, bidValues, controller.signal).finally(
        () => window.clearTimeout(timeout)
      );
    },
    onSuccess: (res) => {
      track(AnalyticsEvents.PaymentVerified, {
        auction_id: auction.id,
        verified: Boolean(res.verified),
      });
      finishVerifyUI(Boolean(res.verified || res.participating));
    },
    onError: (err) => {
      track(AnalyticsEvents.PaymentVerifyFailed, { auction_id: auction.id });
      // Webhook may already have fulfilled — refresh and drop the spinner.
      clearPendingChapa();
      invalidate();
      router.replace(`/auctions/${auction.id}`);
      toastApiError(err, dict.auctionDetail.paymentVerifyError);
    },
  });

  useEffect(() => {
    // Already joined (e.g. webhook fulfilled while on Chapa) — don't keep verifying.
    if (participating || myBids.length > 0) {
      const hasReturnRef =
        searchParams.get("tx_ref") ||
        searchParams.get("trx_ref") ||
        searchParams.get("txRef");
      if (hasReturnRef) {
        clearPendingChapa();
        router.replace(`/auctions/${auction.id}`);
      } else {
        clearPendingChapa();
      }
      return;
    }

    const urlTxRef =
      searchParams.get("tx_ref") ||
      searchParams.get("trx_ref") ||
      searchParams.get("txRef");
    const urlBidRaw = searchParams.get("bid_value");
    const urlBidsRaw = searchParams.get("bid_values");
    let txRefToVerify = urlTxRef || "";
    let bidValuesToVerify: number[] | undefined;

    if (urlBidsRaw) {
      const parsed = urlBidsRaw
        .split(/[,_;|]+/)
        .map((p) => Number.parseFloat(p.trim()))
        .filter((n) => Number.isFinite(n) && n > 0)
        .map(roundMoney);
      if (parsed.length > 0) bidValuesToVerify = parsed;
    } else if (urlBidRaw) {
      const one = Number.parseFloat(urlBidRaw);
      if (Number.isFinite(one) && one > 0) bidValuesToVerify = [roundMoney(one)];
    }

    if (!txRefToVerify) {
      try {
        const stored = sessionStorage.getItem(
          `carramarket_pending_chapa_${auction.id}`
        );
        if (stored) {
          const parsed = JSON.parse(stored) as {
            txRef?: string;
            bidValue?: number;
            bidValues?: number[];
            ts?: number;
          };
          if (
            parsed.txRef &&
            (!parsed.ts || Date.now() - parsed.ts < 30 * 60 * 1000)
          ) {
            txRefToVerify = parsed.txRef;
            if (!bidValuesToVerify?.length) {
              if (parsed.bidValues?.length) {
                bidValuesToVerify = parsed.bidValues.map(roundMoney);
              } else if (parsed.bidValue) {
                bidValuesToVerify = [roundMoney(parsed.bidValue)];
              }
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
        bidValues: bidValuesToVerify,
      });
    }
  }, [auction.id, searchParams, participating, myBids.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const validateBidAmount = (value: number, silent = false): boolean => {
    if (!Number.isFinite(value) || value <= 0) {
      if (!silent) setPackError(dict.auctionDetail.invalidBidError);
      return false;
    }
    const min = auction.minBidValue ?? 0.01;
    if (value < min) {
      if (!silent) {
        setPackError(`${dict.auctionDetail.bidRange}: ${formatCurrency(min)}+`);
      }
      return false;
    }
    if (auction.maxBidValue != null && value > Number(auction.maxBidValue)) {
      if (!silent) {
        setPackError(
          `${dict.auctionDetail.bidRange}: ${formatCurrency(min)} – ${formatCurrency(
            Number(auction.maxBidValue)
          )}`
        );
      }
      return false;
    }
    return true;
  };

  const addTag = () => {
    setPackError(null);
    if (packTags.length >= MAX_PACK) {
      setPackError(dict.auctionDetail.maxPackReached);
      return;
    }
    const value = roundMoney(Number.parseFloat(draftValue));
    if (!validateBidAmount(value)) return;

    const key = value.toFixed(2);
    if (packTags.some((t) => t.toFixed(2) === key)) {
      setPackError(dict.auctionDetail.duplicatePackBid);
      return;
    }
    if (existingValues.has(key)) {
      setPackError(dict.auctionDetail.duplicateExistingBid);
      return;
    }

    setPackTags((prev) => [...prev, value]);
    setDraftValue("");
    draftRef.current?.focus();
  };

  const removeTag = (index: number) => {
    setPackError(null);
    setPackTags((prev) => prev.filter((_, i) => i !== index));
  };

  const participateMutation = useMutation({
    mutationFn: (bidValues: number[]) => {
      const returnUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/auctions/${auction.id}`
          : undefined;
      return participateInAuction(auction.id, {
        bidValues,
        returnUrl,
      });
    },
    onSuccess: (result, bidValues) => {
      if (result.checkoutUrl) {
        track(AnalyticsEvents.PaymentStarted, {
          auction_id: auction.id,
          bid_count: bidValues.length,
          tx_ref: result.txRef || undefined,
        });
        try {
          if (result.txRef) {
            sessionStorage.setItem(
              `carramarket_pending_chapa_${auction.id}`,
              JSON.stringify({
                txRef: result.txRef,
                bidValues,
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
      setPackTags([]);
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

  const submitPack = () => {
    setPackError(null);
    let bidsToSubmit = [...packTags];

    // If user typed a bid in the input box and clicked Pay directly (or pressed Pay with a draft),
    // validate and include it automatically.
    if (draftValue.trim() !== "") {
      if (bidsToSubmit.length >= MAX_PACK) {
        setPackError(dict.auctionDetail.maxPackReached);
        return;
      }
      const value = roundMoney(Number.parseFloat(draftValue));
      if (!validateBidAmount(value)) return;
      const key = value.toFixed(2);
      if (existingValues.has(key)) {
        setPackError(dict.auctionDetail.duplicateExistingBid);
        return;
      }
      if (!bidsToSubmit.some((t) => t.toFixed(2) === key)) {
        bidsToSubmit.push(value);
      }
      setDraftValue("");
      setPackTags(bidsToSubmit);
    }

    if (bidsToSubmit.length === 0) {
      setPackError(dict.auctionDetail.addAtLeastOneBid);
      return;
    }
    participateMutation.mutate(bidsToSubmit);
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
        {hasJoined && (
          <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-200/80 bg-white/80 px-3.5 py-2.5 text-sm">
            <span className="font-semibold text-slate-600">
              {dict.auctionDetail.totalBids}
            </span>
            <span className="font-extrabold text-emerald-800">
              {totalBidsCount.toLocaleString()}
            </span>
          </div>
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
      <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-5 text-sm text-amber-900">
        <p>{dict.auctionDetail.biddingClosed}</p>
        {hasJoined && (
          <div className="flex items-center justify-between rounded-xl border border-amber-200/80 bg-white/80 px-3.5 py-2.5 text-sm">
            <span className="font-semibold text-slate-600">
              {dict.auctionDetail.totalBids}
            </span>
            <span className="font-extrabold text-amber-900">
              {totalBidsCount.toLocaleString()}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {dict.auctionDetail.entranceFee}
          </p>
          <p className="text-2xl font-extrabold text-slate-900">
            {formatCurrency(auction.entranceFee)}
            <span className="ml-1 text-sm font-semibold text-slate-500">
              {dict.auctionDetail.perBid}
            </span>
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {dict.auctionDetail.bidRange}: {formatCurrency(auction.minBidValue ?? 0.01)}
            {auction.maxBidValue != null
              ? ` – ${formatCurrency(Number(auction.maxBidValue))}`
              : "+"}
          </p>
        </div>
        {hasJoined && (
          <div className="shrink-0 rounded-xl border border-sky-200 bg-sky-50/80 px-3.5 py-2 text-right">
            <p className="text-[11px] font-bold uppercase tracking-wider text-sky-700">
              {dict.auctionDetail.totalBids}
            </p>
            <p className="text-xl font-extrabold text-[var(--brand-blue)]">
              {totalBidsCount.toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {verifyMutation.isPending && !hasJoined && (
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
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-800">
              {dict.auctionDetail.yourBidValue}
            </label>
            <div className="flex gap-2">
              <Input
                ref={draftRef}
                type="number"
                step="0.01"
                min={auction.minBidValue ?? 0.01}
                max={auction.maxBidValue ?? undefined}
                value={draftValue}
                onChange={(e) => {
                  setPackError(null);
                  setDraftValue(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder={dict.auctionDetail.bidPlaceholder}
                disabled={!isOpen || participateMutation.isPending}
                className="h-11"
              />
              <Button
                type="button"
                variant="outline"
                className="h-11 shrink-0 gap-1 px-3 font-semibold"
                onClick={addTag}
                disabled={
                  !isOpen ||
                  participateMutation.isPending ||
                  packTags.length >= MAX_PACK
                }
              >
                <Plus className="h-4 w-4" />
                {dict.auctionDetail.addBidBtn}
              </Button>
            </div>
            <p className="text-xs text-slate-500">{dict.auctionDetail.addBidHint}</p>

            {effectiveBids.length > 0 && (
              <div className="space-y-2">
                {packTags.length > 0 && (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        {dict.auctionDetail.yourPack}
                      </p>
                      <span className="text-xs font-semibold text-slate-500">
                        {t("auctionDetail.packCount", {
                          count: String(packTags.length),
                        })}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {packTags.map((value, index) => (
                        <span
                          key={`${value.toFixed(2)}-${index}`}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 py-1 pl-3 pr-1.5 text-sm font-semibold text-slate-900"
                        >
                          {formatCurrency(value)}
                          <button
                            type="button"
                            aria-label={dict.auctionDetail.removeBidAria}
                            className="rounded-full p-0.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                            onClick={() => removeTag(index)}
                            disabled={participateMutation.isPending}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </>
                )}
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 px-3 py-2 text-xs text-slate-600 space-y-1">
                  <div className="flex items-center justify-between">
                    <span>
                      {dict.auctionDetail.entranceFee} ({effectiveBids.length} ×{" "}
                      {formatCurrency(entranceFeeNum)})
                    </span>
                    <span className="font-semibold text-slate-800">
                      {formatCurrency(packEntranceSum)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{dict.auctionDetail.yourBidValue}</span>
                    <span className="font-semibold text-slate-800">
                      {formatCurrency(packBidsSum)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200 pt-1 text-slate-900 font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(packTotal)}</span>
                  </div>
                </div>
              </div>
            )}

            {packError && (
              <p className="text-xs font-medium text-red-600">{packError}</p>
            )}

            <p className="text-xs text-slate-500">
              {dict.auctionDetail.oneUpdateNotice}
            </p>

            <Button
              type="button"
              className="h-12 w-full font-bold"
              disabled={
                !isOpen ||
                participateMutation.isPending ||
                (packTags.length === 0 && !hasValidDraft)
              }
              onClick={submitPack}
            >
              {participateMutation.isPending
                ? dict.auctionDetail.redirectingToChapa
                : t("auctionDetail.placePackAndPayChapa", {
                    count: String(Math.max(effectiveBids.length, 1)),
                    amount: formatCurrency(packTotal || entranceFeeNum),
                  })}
            </Button>
          </div>

          {myBids.length > 0 && (
            <div className="border-t border-slate-100 pt-2">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {dict.auctionDetail.yourBids}
                </p>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                  {dict.auctionDetail.totalBids}: {totalBidsCount.toLocaleString()}
                </span>
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

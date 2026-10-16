"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { queryKeys } from "@/lib/query-keys";
import { toastApiError } from "@/lib/toast-api-error";
import {
  participateInAuction,
  placeBid,
  updateBid,
  type Auction,
  type Bid,
} from "@/services/auctions.service";

function formatEtb(n: number) {
  return `${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ETB`;
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
  const router = useRouter();
  const qc = useQueryClient();
  const [bidValue, setBidValue] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const canBid =
    participating &&
    (auction.status === "active" || auction.status === "postponed");

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

  const participateMutation = useMutation({
    mutationFn: () => participateInAuction(auction.id),
    onSuccess: (result) => {
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }
      toast.success("You're in   place your bids");
      invalidate();
    },
    onError: (err) => toastApiError(err, "Could not join this auction"),
  });

  const placeMutation = useMutation({
    mutationFn: (value: number) => placeBid(auction.id, value),
    onSuccess: () => {
      toast.success("Bid placed");
      setBidValue("");
      invalidate();
    },
    onError: (err) => toastApiError(err, "Could not place bid"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, value }: { id: string; value: number }) =>
      updateBid(id, value),
    onSuccess: () => {
      toast.success("Bid updated");
      setEditingId(null);
      invalidate();
    },
    onError: (err) => toastApiError(err, "Could not update bid"),
  });

  const requireLogin = () => {
    router.push(`/login?redirect=${encodeURIComponent(`/auctions/${auction.id}`)}`);
  };

  if (auction.status === "executed") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
          Auction complete
        </p>
        {auction.winnerBidValue != null ? (
          <p className="mt-2 text-lg font-bold text-slate-900">
            Winning bid: {formatEtb(Number(auction.winnerBidValue))}
          </p>
        ) : (
          <p className="mt-2 text-sm text-slate-600">Results are in.</p>
        )}
      </div>
    );
  }

  if (auction.status === "cancelled") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
        This auction was cancelled.
      </div>
    );
  }

  if (auction.status === "closed") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 text-sm text-amber-900">
        Bidding is closed. Winner resolution is in progress.
      </div>
    );
  }

  return (
    <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Entrance fee
        </p>
        <p className="text-2xl font-extrabold text-slate-900">
          {formatEtb(auction.entranceFee)}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Bid range: {formatEtb(auction.minBidValue ?? 0.01)}
          {auction.maxBidValue != null
            ? ` – ${formatEtb(Number(auction.maxBidValue))}`
            : "+"}
        </p>
      </div>

      {!user ? (
        <Button className="w-full h-12 font-bold" onClick={requireLogin}>
          Log in to join
        </Button>
      ) : !participating ? (
        <Button
          className="w-full h-12 font-bold"
          disabled={participateMutation.isPending}
          onClick={() => participateMutation.mutate()}
        >
          {participateMutation.isPending
            ? "Processing…"
            : "Pay entrance fee & join"}
        </Button>
      ) : (
        <>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              const value = Number.parseFloat(bidValue);
              if (!Number.isFinite(value) || value <= 0) {
                toast.error("Enter a valid bid amount");
                return;
              }
              placeMutation.mutate(value);
            }}
          >
            <label className="block text-sm font-semibold text-slate-800">
              Your bid value
            </label>
            <Input
              type="number"
              step="0.01"
              min={auction.minBidValue ?? 0.01}
              max={auction.maxBidValue ?? undefined}
              value={bidValue}
              onChange={(e) => setBidValue(e.target.value)}
              placeholder="e.g. 1.20"
              disabled={!canBid || placeMutation.isPending}
            />
            <Button
              type="submit"
              className="w-full h-11 font-bold"
              disabled={!canBid || placeMutation.isPending}
            >
              {placeMutation.isPending ? "Placing…" : "Place bid"}
            </Button>
          </form>

          {myBids.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                Your bids
              </p>
              <ul className="space-y-2">
                {myBids.map((bid) => (
                  <li
                    key={bid.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm"
                  >
                    {editingId === bid.id ? (
                      <form
                        className="flex w-full items-center gap-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const value = Number.parseFloat(editValue);
                          if (!Number.isFinite(value) || value <= 0) {
                            toast.error("Enter a valid amount");
                            return;
                          }
                          updateMutation.mutate({ id: bid.id, value });
                        }}
                      >
                        <Input
                          type="number"
                          step="0.01"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="h-9"
                        />
                        <Button
                          type="submit"
                          size="sm"
                          disabled={updateMutation.isPending}
                        >
                          Save
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                      </form>
                    ) : (
                      <>
                        <span className="font-bold text-slate-900">
                          {formatEtb(bid.bidValue)}
                        </span>
                        {canBid && (
                          <button
                            type="button"
                            className="text-xs font-semibold text-[var(--brand-blue)] hover:underline"
                            onClick={() => {
                              setEditingId(bid.id);
                              setEditValue(String(bid.bidValue));
                            }}
                          >
                            Edit
                          </button>
                        )}
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

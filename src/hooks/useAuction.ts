"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  getAuction,
  getMyBids,
  getMyParticipation,
} from "@/services/auctions.service";
import { queryKeys } from "@/lib/query-keys";
import { useAuth } from "@/contexts/AuthContext";

export function useAuction(id: string) {
  const { user } = useAuth();
  return useQuery({
    // Keyed by viewer: the first request often goes out before the session is restored
    // (Telegram Mini App auto-login, expired token, logging in from the auction page). That
    // anonymous answer says "not eligible for free entrance" and must not be reused once the
    // customer is signed in - a new key forces a refetch with their identity.
    queryKey: queryKeys.auctions.detailForViewer(id, user?.id),
    queryFn: () => getAuction(id),
    enabled: Boolean(id),
    // Keep showing the auction while the signed-in version loads (no full-page spinner).
    placeholderData: keepPreviousData,
  });
}

export function useMyBids(productId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.auctions.myBids(productId),
    queryFn: () => getMyBids(productId),
    enabled: Boolean(productId) && Boolean(user),
  });
}

export function useMyParticipation(productId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.auctions.myParticipation(productId),
    queryFn: () => getMyParticipation(productId),
    enabled: Boolean(productId) && Boolean(user),
  });
}

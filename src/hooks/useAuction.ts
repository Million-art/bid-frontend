"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getAuction,
  getMyBids,
  getMyParticipation,
} from "@/services/auctions.service";
import { queryKeys } from "@/lib/query-keys";
import { useAuth } from "@/contexts/AuthContext";

export function useAuction(id: string) {
  return useQuery({
    queryKey: queryKeys.auctions.detail(id),
    queryFn: () => getAuction(id),
    enabled: Boolean(id),
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

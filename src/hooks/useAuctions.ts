"use client";

import { useQuery } from "@tanstack/react-query";
import { listAuctions } from "@/services/auctions.service";
import { queryKeys } from "@/lib/query-keys";

export function useAuctions(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.auctions.list(params ?? {}),
    queryFn: () => listAuctions(params),
  });
}

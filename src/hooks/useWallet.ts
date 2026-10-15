"use client";

import { useQuery } from "@tanstack/react-query";
import { walletService } from "@/services/wallet.service";
import { queryKeys } from "@/lib/query-keys";

export function useWallet() {
  const query = useQuery({
    queryKey: queryKeys.me.wallet(),
    queryFn: () => walletService.getBalance(),
    staleTime: 1000 * 60, // 1 minute
  });

  return query;
}

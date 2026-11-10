/**
 * Centralized query keys for TanStack Query.
 * Enables consistent cache invalidation and prevents typos.
 */
export const queryKeys = {
  all: ["client"] as const,
  auctions: {
    all: () => [...queryKeys.all, "auctions"] as const,
    lists: () => [...queryKeys.auctions.all(), "list"] as const,
    list: (filters: {
      page?: number;
      limit?: number;
      status?: string;
      search?: string;
      sort?: string;
    }) => [...queryKeys.auctions.lists(), filters] as const,
    infinite: (filters: {
      limit?: number;
      status?: string;
      search?: string;
      sort?: string;
    }) => [...queryKeys.auctions.lists(), "infinite", filters] as const,
    details: () => [...queryKeys.auctions.all(), "detail"] as const,
    detail: (id: string) => [...queryKeys.auctions.details(), id] as const,
    /**
     * The detail payload is viewer-specific (free-entrance eligibility, joined flag), so the
     * cache entry is per viewer. Still prefixed by detail(id), so invalidating detail(id)
     * refreshes it.
     */
    detailForViewer: (id: string, viewerId?: string | null) =>
      [...queryKeys.auctions.detail(id), "viewer", viewerId || "anon"] as const,
    myBids: (id: string) =>
      [...queryKeys.auctions.detail(id), "my-bids"] as const,
    myParticipation: (id: string) =>
      [...queryKeys.auctions.detail(id), "my-participation"] as const,
  },
  me: {
    auctions: (filters?: { page?: number; limit?: number }) =>
      [...queryKeys.all, "me", "auctions", filters ?? {}] as const,
  },
  notifications: {
    all: () => [...queryKeys.all, "notifications"] as const,
    list: (params?: { limit?: number; offset?: number }) =>
      [...queryKeys.notifications.all(), params ?? {}] as const,
    unreadCount: () =>
      [...queryKeys.notifications.all(), "unread-count"] as const,
  },
} as const;

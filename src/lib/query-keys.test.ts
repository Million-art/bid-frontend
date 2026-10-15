import { describe, it, expect } from "vitest";
import { queryKeys } from "./query-keys";

describe("queryKeys", () => {
  it("has consistent structure for auctions", () => {
    expect(queryKeys.auctions.list({ page: 1, limit: 20 })).toEqual([
      "client",
      "auctions",
      "list",
      { page: 1, limit: 20 },
    ]);
  });

  it("auction detail key includes id", () => {
    expect(queryKeys.auctions.detail("abc-123")).toEqual([
      "client",
      "auctions",
      "detail",
      "abc-123",
    ]);
  });

  it("me.auctions key includes filters", () => {
    expect(queryKeys.me.auctions({ page: 1 })).toEqual([
      "client",
      "me",
      "auctions",
      { page: 1 },
    ]);
  });

  it("notifications keys are nested correctly", () => {
    expect(queryKeys.notifications.unreadCount()).toEqual([
      "client",
      "notifications",
      "unread-count",
    ]);
  });
});

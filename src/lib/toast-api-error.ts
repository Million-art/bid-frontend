"use client";

import { toast } from "sonner";
import { getErrorMessage } from "./api";

function isUninformativeClientMessage(msg: string): boolean {
  const t = msg.trim();
  if (!t) return true;
  if (t === "An unexpected error occurred") return true;
  return false;
}

function isLikelyNetworkFailure(msg: string): boolean {
  const lower = msg.toLowerCase();
  return (
    msg === "Failed to fetch" ||
    lower.includes("networkerror") ||
    msg === "Load failed" ||
    lower.includes("network request failed") ||
    lower.includes("internet connection appears to be offline")
  );
}

/** Prefer API `message` from {@link getErrorMessage}; use `fallback` when empty/generic; map common network errors. */
export function toastApiError(
  error: unknown,
  fallback: string,
  toastOpts?: Parameters<typeof toast.error>[1]
): void {
  const raw = getErrorMessage(error).trim();
  if (isLikelyNetworkFailure(raw)) {
    toast.error("Could not reach the server. Check your connection and try again.", toastOpts);
    return;
  }
  toast.error(isUninformativeClientMessage(raw) ? fallback : raw, toastOpts);
}

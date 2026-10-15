import { format } from "date-fns";

/** Display label for API `updatedAt` (ISO string). */
export function formatLegalUpdatedLabel(updatedAt: string | null): string {
  if (!updatedAt) return " ";
  try {
    return format(new Date(updatedAt), "MMM d, yyyy");
  } catch {
    return " ";
  }
}

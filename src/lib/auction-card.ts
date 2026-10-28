export type UrgencyLevel = "normal" | "soon" | "critical" | "ended";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/** Countdown urgency from remaining ms (mocked end times in tests). */
export function getCountdownUrgency(msLeft: number | null): UrgencyLevel {
  if (msLeft == null) return "normal";
  if (msLeft <= 0) return "ended";
  if (msLeft < HOUR_MS) return "critical";
  if (msLeft < DAY_MS) return "soon";
  return "normal";
}

export function formatCountdownParts(msLeft: number): {
  desktop: string;
  mobile: string;
} | null {
  if (msLeft <= 0) return null;
  const totalSeconds = Math.floor(msLeft / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const desktop =
    days > 0
      ? `${days}d ${hours}h ${minutes}m`
      : hours > 0
        ? `${hours}h ${minutes}m`
        : `${minutes}m`;

  const mobile =
    days > 0
      ? `${days}d ${String(hours).padStart(2, "0")}h`
      : hours > 0
        ? `${hours}h ${String(minutes).padStart(2, "0")}m`
        : `${minutes}m`;

  return { desktop, mobile };
}

export function getEntrantProgress(
  participantCount: number,
  minParticipants: number
): {
  ratio: number;
  percent: number;
  prizeUnlocked: boolean;
} {
  const min = Math.max(1, minParticipants || 10);
  const count = Math.max(0, participantCount || 0);
  const ratio = Math.min(1, count / min);
  return {
    ratio,
    percent: Math.round(ratio * 100),
    prizeUnlocked: count >= min,
  };
}

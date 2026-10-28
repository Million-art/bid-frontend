import { describe, expect, it } from "vitest";
import {
  formatCountdownParts,
  getCountdownUrgency,
  getEntrantProgress,
} from "./auction-card";

describe("getCountdownUrgency", () => {
  it("returns normal when more than 48h left", () => {
    expect(getCountdownUrgency(49 * 60 * 60 * 1000)).toBe("normal");
  });

  it("returns normal between 24h and 48h", () => {
    expect(getCountdownUrgency(36 * 60 * 60 * 1000)).toBe("normal");
  });

  it("returns soon under 24h", () => {
    expect(getCountdownUrgency(23 * 60 * 60 * 1000)).toBe("soon");
    expect(getCountdownUrgency(2 * 60 * 60 * 1000)).toBe("soon");
  });

  it("returns critical under 1h", () => {
    expect(getCountdownUrgency(59 * 60 * 1000)).toBe("critical");
    expect(getCountdownUrgency(30_000)).toBe("critical");
  });

  it("returns ended at or past close", () => {
    expect(getCountdownUrgency(0)).toBe("ended");
    expect(getCountdownUrgency(-1000)).toBe("ended");
  });
});

describe("formatCountdownParts", () => {
  it("formats multi-day and sub-hour leftovers", () => {
    const multi = formatCountdownParts(2 * 86400_000 + 3 * 3600_000 + 15 * 60_000);
    expect(multi?.desktop).toBe("2d 3h 15m");
    expect(formatCountdownParts(0)).toBeNull();
  });
});

describe("getEntrantProgress", () => {
  it("handles 0%, partial, and 100% unlock", () => {
    expect(getEntrantProgress(0, 10)).toEqual({
      ratio: 0,
      percent: 0,
      prizeUnlocked: false,
    });
    expect(getEntrantProgress(5, 10)).toEqual({
      ratio: 0.5,
      percent: 50,
      prizeUnlocked: false,
    });
    expect(getEntrantProgress(10, 10)).toEqual({
      ratio: 1,
      percent: 100,
      prizeUnlocked: true,
    });
    expect(getEntrantProgress(12, 10).prizeUnlocked).toBe(true);
  });
});

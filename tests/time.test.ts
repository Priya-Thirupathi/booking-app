import { describe, it, expect } from "vitest";
import { zonedTimeToUtcMs } from "../lib/time";

describe("zonedTimeToUtcMs", () => {
  it("converts an IST wall-clock time to the correct UTC instant", () => {
    // 19:00 IST (UTC+5:30) = 13:30 UTC.
    const ms = zonedTimeToUtcMs("2026-12-25", "19:00:00", "Asia/Kolkata");
    expect(new Date(ms).toISOString()).toBe("2026-12-25T13:30:00.000Z");
  });

  it("gives the same instant regardless of the process's own local timezone", () => {
    // The bug this replaces: a `toLocaleString` + `new Date(string)` round-trip silently
    // produces the wrong instant whenever the server's local zone happens to equal the target
    // zone (the correction collapses to zero). This machine's local zone is Asia/Kolkata, which
    // is exactly the case that hid the bug — assert against a zone that's never the local one.
    const ms = zonedTimeToUtcMs("2026-06-15", "09:00:00", "America/New_York");
    // 09:00 EDT (UTC-4, mid-June is DST) = 13:00 UTC.
    expect(new Date(ms).toISOString()).toBe("2026-06-15T13:00:00.000Z");
  });

  it("handles a UTC-ahead zone correctly", () => {
    // 09:00 JST (UTC+9) = 00:00 UTC same day.
    const ms = zonedTimeToUtcMs("2026-03-10", "09:00:00", "Asia/Tokyo");
    expect(new Date(ms).toISOString()).toBe("2026-03-10T00:00:00.000Z");
  });
});

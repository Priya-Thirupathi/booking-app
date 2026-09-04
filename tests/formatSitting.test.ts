import { describe, it, expect, afterEach } from "vitest";
import { formatSittingTime } from "../lib/formatSitting";

const RealDateTimeFormat = Intl.DateTimeFormat;

/** Stubs `Intl.DateTimeFormat().resolvedOptions().timeZone` (the no-arg call formatSitting.ts
 * uses to read the viewer's zone) to a fixed value, leaving every other call untouched. */
function stubViewerZone(zone: string) {
  Intl.DateTimeFormat = function (...args: unknown[]) {
    // @ts-expect-error -- constructing the real formatter, just relaying args through
    const instance = new RealDateTimeFormat(...args);
    if (args.length === 0) {
      const resolved = instance.resolvedOptions();
      instance.resolvedOptions = () => ({ ...resolved, timeZone: zone });
    }
    return instance;
  } as typeof Intl.DateTimeFormat;
}

describe("formatSittingTime", () => {
  afterEach(() => {
    Intl.DateTimeFormat = RealDateTimeFormat;
  });

  it("hides the viewer label when the viewer's zone is a same-offset alias of the restaurant's", () => {
    // Found by manually testing the app: the browser reported "Asia/Calcutta" (a legacy alias)
    // while sittings are stored under the canonical "Asia/Kolkata" — same zone, different
    // string, so a naive `viewerZone === timezone` check missed it and showed a redundant
    // "12:00 PM your time" line under a "12:00 PM" headline.
    stubViewerZone("Asia/Calcutta");
    const { viewerLabel } = formatSittingTime("2026-12-25", "19:00:00", "Asia/Kolkata");
    expect(viewerLabel).toBeNull();
  });

  it("shows the viewer's local time when the zones genuinely differ", () => {
    stubViewerZone("America/New_York");
    const { viewerLabel } = formatSittingTime("2026-12-25", "19:00:00", "Asia/Kolkata");
    // 19:00 IST on Dec 25 is 08:30 EST the same calendar day.
    expect(viewerLabel).toBe("8:30 AM EST");
  });
});

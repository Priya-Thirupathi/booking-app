import { describe, it, expect } from "vitest";
import { canCancel } from "../lib/canCancel";

describe("canCancel", () => {
  const confirmedBooking = {
    status: "confirmed" as const,
    sittingDate: "2026-12-25",
    sittingStartTime: "19:00:00", // 19:00 IST = 13:30 UTC
    sittingTimezone: "Asia/Kolkata",
  };

  it("honors the live default policy (cutoff, 2h before the sitting) with no policy passed", () => {
    // Confirmed 4 Sep: cancellable up to 2 hours before the sitting. If CANCEL_POLICY changes
    // again, update this test's expectation to match the new default, not the other way round.
    const wellBeforeCutoff = new Date("2026-01-01"); // months ahead of the 2h window
    const withinCutoff = new Date("2026-12-25T12:00:00Z"); // 1.5h before 13:30 UTC sitting
    expect(canCancel(confirmedBooking, wellBeforeCutoff)).toBe(true);
    expect(canCancel(confirmedBooking, withinCutoff)).toBe(false);
  });

  it("never allows cancelling an already-cancelled booking, under any policy", () => {
    const cutoffPolicy = { mode: "cutoff" as const, hoursBeforeSitting: 2 };
    expect(canCancel({ ...confirmedBooking, status: "cancelled" }, new Date(), cutoffPolicy)).toBe(
      false,
    );
  });

  it("cutoff mode allows cancellation before the cutoff and blocks it after", () => {
    // Exercises the cutoff mechanism directly, independent of which policy is live, by passing
    // the policy explicitly rather than relying on the module-level CANCEL_POLICY constant.
    const cutoffPolicy = { mode: "cutoff" as const, hoursBeforeSitting: 2 };
    const sittingAtUtc = new Date("2026-12-25T13:30:00Z");
    const threeHoursBefore = new Date(sittingAtUtc.getTime() - 3 * 60 * 60 * 1000);
    const oneHourBefore = new Date(sittingAtUtc.getTime() - 1 * 60 * 60 * 1000);

    expect(canCancel(confirmedBooking, threeHoursBefore, cutoffPolicy)).toBe(true);
    expect(canCancel(confirmedBooking, oneHourBefore, cutoffPolicy)).toBe(false);
  });
});

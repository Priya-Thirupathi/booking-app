/**
 * Single source of truth for whether a booking may be cancelled right now.
 *
 * Nalin's brief listed cancel as required; his initial clarification said it shouldn't be
 * possible; confirmed 4 Sep: cancellation is allowed up to 2 hours before the sitting. Kept as
 * a policy object rather than a hardcoded boolean because that history — one requirement,
 * contradicted, then refined — is exactly the shape that changes again. If it does, this is the
 * one place to change; nothing else in the app (the API route, the My Bookings page's cancel
 * button) needs to know the policy, only whether this function says yes.
 */

import { zonedTimeToUtcMs } from "./time";

export type CancelPolicy =
  | { mode: "never" }
  | { mode: "cutoff"; hoursBeforeSitting: number };

// Current policy, confirmed 4 Sep 2026: cancellable up to 2 hours before the sitting.
export const CANCEL_POLICY: CancelPolicy = { mode: "cutoff", hoursBeforeSitting: 2 };

export interface CancellableBooking {
  status: "confirmed" | "cancelled";
  sittingDate: string; // 'YYYY-MM-DD'
  sittingStartTime: string; // 'HH:MM:SS'
  sittingTimezone: string; // IANA zone, e.g. 'Asia/Kolkata'
}

// `policy` defaults to the live CANCEL_POLICY and callers never need to pass it — it's a
// parameter (not a closed-over constant) purely so tests can exercise the cutoff math against a
// fixed policy without depending on whichever mode happens to be live.
export function canCancel(
  booking: CancellableBooking,
  now: Date = new Date(),
  policy: CancelPolicy = CANCEL_POLICY,
): boolean {
  if (booking.status !== "confirmed") return false;
  if (policy.mode === "never") return false;

  const sittingAtMs = zonedTimeToUtcMs(
    booking.sittingDate,
    booking.sittingStartTime,
    booking.sittingTimezone,
  );
  const hoursUntilSitting = (sittingAtMs - now.getTime()) / (1000 * 60 * 60);
  return hoursUntilSitting >= policy.hoursBeforeSitting;
}

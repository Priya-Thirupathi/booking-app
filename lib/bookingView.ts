import type { BookingRow } from "./booking";
import { canCancel } from "./canCancel";
import { zonedTimeToUtcMs } from "./time";

// The shape sent to the client. Whether cancel is offered is decided here, server-side — the
// client only renders the button if told to, it never decides the policy itself. The actual
// cancel endpoint re-checks the same policy independently, so this is a UI convenience, not the
// authorization boundary.
export interface BookingView {
  id: string;
  referenceCode: string;
  name: string;
  email: string;
  phone: string;
  partySize: number;
  status: "confirmed" | "cancelled";
  date: string;
  startTime: string;
  timezone: string;
  createdAt: string;
  canCancel: boolean;
  isPast: boolean;
}

export function toBookingView(row: BookingRow): BookingView {
  const sittingAtMs = zonedTimeToUtcMs(row.date, row.start_time, row.timezone);
  return {
    id: row.id,
    referenceCode: row.reference_code,
    name: row.name,
    email: row.email,
    phone: row.phone,
    partySize: row.party_size,
    status: row.status,
    date: row.date,
    startTime: row.start_time,
    timezone: row.timezone,
    createdAt: row.created_at,
    canCancel: canCancel({
      status: row.status,
      sittingDate: row.date,
      sittingStartTime: row.start_time,
      sittingTimezone: row.timezone,
    }),
    isPast: sittingAtMs < Date.now(),
  };
}

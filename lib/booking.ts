import { randomInt } from "node:crypto";
import { pool } from "./db";

// Unambiguous charset: no 0/O, 1/I/L — the reference is read aloud and typed back on another
// device, so characters that look alike on a phone screen are worth avoiding.
const REFERENCE_CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const REFERENCE_LENGTH = 7;

function generateReferenceCode(): string {
  let code = "";
  for (let i = 0; i < REFERENCE_LENGTH; i++) {
    code += REFERENCE_CHARSET[randomInt(REFERENCE_CHARSET.length)];
  }
  return code;
}

export type CreateBookingResult =
  | { ok: true; id: string; referenceCode: string }
  | { ok: false; reason: "slot_not_found" }
  | { ok: false; reason: "slot_full" }
  | { ok: false; reason: "already_booked" };

export interface CreateBookingInput {
  slotId: string;
  name: string;
  email: string;
  phone: string;
  partySize: number;
  ip: string | null;
}

// The atomic booking write. The UPDATE's WHERE clause and the INSERT run as one implicit
// transaction (a single statement), so a unique-constraint violation on the insert (duplicate
// email+slot) rolls back the seat increment too — there's no window where seats are held
// against a booking that didn't actually get created.
const BOOK_SQL = `
  with upd as (
    update sittings
    set seats_taken = seats_taken + $2
    where id = $1 and seats_taken + $2 <= capacity
    returning id
  )
  insert into bookings (slot_id, reference_code, name, email, phone, party_size, ip)
  select $1, $3, $4, $5, $6, $2, $7
  from upd
  returning id, reference_code
`;

export async function createBooking(input: CreateBookingInput): Promise<CreateBookingResult> {
  const { slotId, name, email, phone, partySize, ip } = input;

  // Reference-code collisions are astronomically unlikely (32^7 space) but cheap to guard.
  for (let attempt = 0; attempt < 5; attempt++) {
    const referenceCode = generateReferenceCode();
    try {
      const result = await pool.query(BOOK_SQL, [
        slotId,
        partySize,
        referenceCode,
        name,
        email,
        phone,
        ip,
      ]);
      if (result.rowCount === 1) {
        return { ok: true, id: result.rows[0].id, referenceCode: result.rows[0].reference_code };
      }
      // Zero rows: either the slot doesn't exist, or booking it would oversell it. Disambiguate
      // for the error message only — correctness never depends on this second query.
      const slot = await pool.query("select id from sittings where id = $1", [slotId]);
      if (slot.rowCount === 0) {
        return { ok: false, reason: "slot_not_found" };
      }
      return { ok: false, reason: "slot_full" };
    } catch (err) {
      const pgErr = err as { code?: string; constraint?: string };
      if (pgErr.code === "23505") {
        if (pgErr.constraint === "bookings_reference_code_key") {
          continue; // collision on the reference code itself — retry with a fresh one
        }
        if (pgErr.constraint === "bookings_email_slot_confirmed_idx") {
          return { ok: false, reason: "already_booked" };
        }
      }
      throw err;
    }
  }
  throw new Error("Could not generate a unique booking reference after 5 attempts");
}

export interface BookingRow {
  id: string;
  reference_code: string;
  name: string;
  email: string;
  phone: string;
  party_size: number;
  status: "confirmed" | "cancelled";
  created_at: string;
  slot_id: string;
  date: string;
  start_time: string;
  timezone: string;
  capacity: number;
}

const BOOKING_SELECT = `
  select b.id, b.reference_code, b.name, b.email, b.phone, b.party_size, b.status,
         b.created_at, s.id as slot_id, s.date, s.start_time, s.timezone, s.capacity
  from bookings b
  join sittings s on s.id = b.slot_id
`;

export async function findBookingsByCookieIds(ids: string[]): Promise<BookingRow[]> {
  if (ids.length === 0) return [];
  const result = await pool.query(`${BOOKING_SELECT} where b.id = any($1) order by s.date desc`, [
    ids,
  ]);
  return result.rows;
}

export async function findBookingsByReferenceAndEmail(
  referenceCode: string,
  email: string,
): Promise<BookingRow[]> {
  const result = await pool.query(
    `${BOOKING_SELECT} where b.reference_code = $1 and lower(b.email) = lower($2)`,
    [referenceCode, email],
  );
  return result.rows;
}

export type CancelResult = "ok" | "not_found" | "forbidden" | "policy_blocked";

export async function cancelBooking(
  bookingId: string,
  email: string,
  isAllowed: (booking: BookingRow) => boolean,
): Promise<CancelResult> {
  const result = await pool.query(`${BOOKING_SELECT} where b.id = $1`, [bookingId]);
  const booking: BookingRow | undefined = result.rows[0];
  if (!booking) return "not_found";
  // Authorization: knowing the id (a UUID from a URL) is not enough. The email must match the
  // booking's own email, the same credential already required for cross-device lookup.
  if (booking.email.toLowerCase() !== email.toLowerCase()) return "forbidden";
  if (!isAllowed(booking)) return "policy_blocked";

  const upd = await pool.query(
    `with released as (
       update sittings set seats_taken = seats_taken - $2
       where id = $1
       returning id
     )
     update bookings set status = 'cancelled', cancelled_at = now()
     where id = $3 and status = 'confirmed'
     returning id`,
    [booking.slot_id, booking.party_size, bookingId],
  );
  return upd.rowCount === 1 ? "ok" : "not_found";
}

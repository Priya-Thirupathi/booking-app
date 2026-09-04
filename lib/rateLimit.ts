import { pool } from "./db";

// Postgres-backed IP rate limit rather than an in-memory counter or Redis: an in-memory counter
// resets on every serverless cold start and doesn't share state across instances, and adding
// Redis is an account/dependency this window doesn't have time for. `bookings` already has an
// (ip, created_at) index for exactly this query, so this is a cheap read, not a new store.
const WINDOW_MINUTES = 10;
const MAX_BOOKINGS_PER_WINDOW = 5;

export async function isRateLimited(ip: string | null): Promise<boolean> {
  if (!ip) return false; // can't rate-limit what we can't identify; other layers still apply
  const result = await pool.query(
    `select count(*)::int as count from bookings
     where ip = $1 and created_at > now() - interval '${WINDOW_MINUTES} minutes'`,
    [ip],
  );
  return result.rows[0].count >= MAX_BOOKINGS_PER_WINDOW;
}

export function getClientIp(headers: Headers): string | null {
  // Vercel sets x-forwarded-for; take the first (client) hop.
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip");
}

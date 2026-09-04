export const MY_BOOKINGS_COOKIE = "my_bookings";
const MAX_REMEMBERED = 20;

// The cookie only ever holds booking ids (UUIDs), never anything else about the booking — the
// server still checks status/email server-side on every read, this is just "which ids to ask
// about" so the same-device case needs no typing.
export function parseBookingIdsCookie(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter((v) => /^[0-9a-f-]{36}$/i.test(v));
}

export function addBookingIdToCookie(existing: string | undefined, newId: string): string {
  const ids = parseBookingIdsCookie(existing);
  const updated = [newId, ...ids.filter((id) => id !== newId)].slice(0, MAX_REMEMBERED);
  return updated.join(",");
}

/**
 * Convert a wall-clock date+time as observed in an IANA timezone to a UTC instant, without
 * depending on the *server's* local timezone at all.
 *
 * The common one-liner for this (`new Date(d.toLocaleString('en-US', {timeZone})))`) silently
 * breaks when the server's own local timezone happens to equal the target zone — the correction
 * it's trying to apply collapses to zero, because `new Date(string)` parses that string as the
 * server's local time, and if that already *is* the target zone, no error is visible... until
 * the same code runs on a server in a different zone (e.g. Vercel, which runs UTC) and produces
 * silently wrong instants. Sittings display times in the restaurant's fixed zone regardless of
 * where the app happens to be deployed, so this can't depend on the deploy target's local zone.
 *
 * Accurate to a single Intl.DateTimeFormat pass — good to the minute except inside the zone's
 * own DST-transition window, which isn't worth a second correction pass for a booking app.
 */
export function zonedTimeToUtcMs(dateStr: string, timeStr: string, timeZone: string): number {
  const guess = Date.parse(`${dateStr}T${timeStr}Z`); // wall-clock numbers, read as if UTC

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(guess));

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  // What "guess" (an instant) looks like when read back as wall-clock in `timeZone`.
  const guessSeenInZone = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );

  // The zone's offset at that instant, then apply it in the other direction to go from the
  // wall-clock we actually want back to the correct UTC instant.
  const offsetMs = guessSeenInZone - guess;
  return guess - offsetMs;
}

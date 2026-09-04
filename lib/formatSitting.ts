import { zonedTimeToUtcMs } from "./time";

export interface SittingTimeLabel {
  /** e.g. "Fri, Dec 25, 7:00 PM IST" — the restaurant's own wall-clock time, always shown. */
  restaurantLabel: string;
  /**
   * e.g. "8:30 AM EST" — the viewer's local equivalent, only set when it actually differs from
   * the restaurant's zone. Showing a diner their own local time for a place they're physically
   * travelling to is misleading (PRD), so this is secondary, not the headline.
   */
  viewerLabel: string | null;
}

export function formatSittingTime(date: string, startTime: string, timezone: string): SittingTimeLabel {
  const ms = zonedTimeToUtcMs(date, startTime, timezone);
  const instant = new Date(ms);

  const restaurantLabel = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(instant);

  // Compare actual UTC offset at this instant, not the zone identifier string — the browser can
  // report a legacy alias (e.g. "Asia/Calcutta") for the same zone the restaurant stores under
  // its canonical IANA name ("Asia/Kolkata"). Those are the same place and should never show a
  // redundant second line; comparing offsets rather than names gets that right regardless of
  // which alias either side happens to use.
  const viewerZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const sameOffset = offsetLabel(instant, viewerZone) === offsetLabel(instant, timezone);
  const viewerLabel = sameOffset
    ? null
    : new Intl.DateTimeFormat("en-US", {
        timeZone: viewerZone,
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      }).format(instant);

  return { restaurantLabel, viewerLabel };
}

function offsetLabel(instant: Date, timeZone: string): string {
  return (
    new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" })
      .formatToParts(instant)
      .find((p) => p.type === "timeZoneName")?.value ?? ""
  );
}

export function todayInViewerTimezone(): string {
  // Local date parts (getFullYear/getMonth/getDate), not toISOString — that's UTC, which is the
  // wrong calendar day for anyone west of Greenwich in the evening.
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

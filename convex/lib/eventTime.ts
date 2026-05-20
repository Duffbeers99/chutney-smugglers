/**
 * Timezone-aware helpers for combining a curry event's scheduledDate and
 * scheduledTime into an absolute UTC instant.
 *
 * Why this exists: the client stores `scheduledDate` as
 * `new Date(date).setHours(0, 0, 0, 0).getTime()` — i.e. midnight in the
 * browser's local timezone. For a UK user in BST (May–Oct) that's
 * `Day 00:00 BST` = `(Day - 1) 23:00 UTC`. Convex functions run in UTC,
 * so the previous pattern of `new Date(scheduledDate); setHours(hh, mm)`
 * on the server modified the date in UTC and produced an event start on
 * the WRONG calendar day — causing events to appear active up to ~24h
 * early (see getActiveEvent firing the day before the booking).
 *
 * The app is UK-based, so we interpret scheduledTime as Europe/London
 * local time and derive the calendar day from scheduledDate in the same
 * zone before assembling the UTC instant.
 */

const APP_TIMEZONE = "Europe/London";

const ukFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: APP_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

function getUkParts(utcMs: number) {
  const parts = ukFormatter.formatToParts(new Date(utcMs));
  const lookup = (type: string) =>
    Number(parts.find((p) => p.type === type)!.value);
  // Intl can return "24" for hour at midnight in some runtimes — normalise.
  const hour = lookup("hour") % 24;
  return {
    year: lookup("year"),
    month: lookup("month"),
    day: lookup("day"),
    hour,
    minute: lookup("minute"),
    second: lookup("second"),
  };
}

function getUkOffsetMs(utcMs: number): number {
  const p = getUkParts(utcMs);
  const asIfUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asIfUtc - utcMs;
}

/**
 * Returns the UTC millisecond timestamp for an event's scheduled start,
 * treating `scheduledDate` as a UK calendar day and `scheduledTime`
 * ("HH:mm") as Europe/London local time.
 */
export function getEventStartTime(
  scheduledDate: number,
  scheduledTime: string,
): number {
  const { year, month, day } = getUkParts(scheduledDate);
  const [hours, minutes] = scheduledTime.split(":").map(Number);

  // Build a naive UTC instant as if HH:mm were UTC, then shift by the UK
  // offset that applies at that instant to land on the real UTC time.
  const naiveUtc = Date.UTC(year, month - 1, day, hours, minutes, 0, 0);
  return naiveUtc - getUkOffsetMs(naiveUtc);
}

/**
 * Returns the UTC millisecond timestamp for 00:00 UK time on the calendar
 * day stored in `scheduledDate`. Useful for "is this event today?" checks.
 */
export function getEventDayStartUtc(scheduledDate: number): number {
  return getEventStartTime(scheduledDate, "00:00");
}

/**
 * Returns the UTC millisecond timestamp for 00:00 UK time on the given
 * absolute instant (defaults to now). Pair with `getEventDayStartUtc` to
 * compare two calendar days in the UK timezone regardless of where the
 * server runs.
 */
export function getDayStartUtc(utcMs: number = Date.now()): number {
  const { year, month, day } = getUkParts(utcMs);
  const naiveUtc = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
  return naiveUtc - getUkOffsetMs(naiveUtc);
}

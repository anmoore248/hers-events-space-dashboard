/**
 * Time zone conversion with the built-in Intl API (no extra library).
 * Times are stored in UTC and entered/shown in the event's time zone (doc §8.1).
 */

function offsetMs(ts: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(new Date(ts));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - Math.floor(ts / 1000) * 1000;
}

/** "2027-06-14" + "09:00" in America/New_York → the UTC instant. */
export function zonedToUtc(date: string, time: string, timeZone: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  let ts = guess - offsetMs(guess, timeZone);
  const second = offsetMs(ts, timeZone);
  if (guess - second !== ts) ts = guess - second;
  return new Date(ts);
}

/** A UTC instant → { date: "YYYY-MM-DD", time: "HH:mm" } in the time zone. */
export function utcToZoned(instant: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  }).formatToParts(instant);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
}

/** "YYYY-MM-DDTHH:mm" (a datetime-local input) in the time zone → UTC instant. */
export function localInputToUtc(value: string | undefined | null, timeZone: string): Date | null {
  if (!value) return null;
  const [d, t = "00:00"] = value.split("T");
  return zonedToUtc(d, t.slice(0, 5), timeZone);
}

/** UTC instant → "YYYY-MM-DDTHH:mm" for a datetime-local input in the time zone. */
export function utcToLocalInput(instant: Date | null | undefined, timeZone: string) {
  if (!instant) return undefined;
  const { date, time } = utcToZoned(instant, timeZone);
  return `${date}T${time}`;
}

/** Today's date in the time zone, "YYYY-MM-DD". */
export function todayIn(timeZone: string, now = new Date()) {
  return utcToZoned(now, timeZone).date;
}

/** Adds days to "YYYY-MM-DD". */
export function addDays(date: string, days: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Postgres `date` columns arrive as "YYYY-MM-DD" strings or Dates depending on the driver. */
export function dateString(v: string | Date | null | undefined) {
  if (!v) return undefined;
  if (typeof v === "string") return v.slice(0, 10);
  return v.toISOString().slice(0, 10);
}

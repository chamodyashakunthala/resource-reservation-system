export const ORG_TIME_ZONE = "Asia/Colombo";
const OFFSET = "+05:30"; // Sri Lanka has no daylight saving, so a fixed offset is safe

// Turns "2026-10-14T10:00" from a datetime-local input into an exact moment
export function parseOrgLocal(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const d = new Date(`${value}:00${OFFSET}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: ORG_TIME_ZONE,
  weekday: "short",
  day: "numeric",
  month: "short",
});
const timeFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: ORG_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function formatRange(start: Date, end: Date): string {
  const sameDay = dateFmt.format(start) === dateFmt.format(end);
  return sameDay
    ? `${dateFmt.format(start)}, ${timeFmt.format(start)}–${timeFmt.format(end)}`
    : `${dateFmt.format(start)} ${timeFmt.format(start)} – ${dateFmt.format(end)} ${timeFmt.format(end)}`;
}
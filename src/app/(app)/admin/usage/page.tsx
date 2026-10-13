import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ORG_TIME_ZONE, parseOrgLocal, formatRange } from "@/lib/time";

const DAY = 86400000;

type Stat = {
  pastCount: number;
  pastHours: number;
  upCount: number;
  upHours: number;
  next: { title: string; start: Date; end: Date } | null;
};

export default async function UsagePage() {
  await requireAdmin();

  const now = new Date();
  const from = new Date(now.getTime() - 30 * DAY);
  const to = new Date(now.getTime() + 30 * DAY);

  // "Today" in the organization's time zone (Sri Lanka)
  const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: ORG_TIME_ZONE }).format(now);
  const todayStart = parseOrgLocal(`${todayStr}T00:00`)!;
  const todayEnd = new Date(todayStart.getTime() + DAY);

  const [resources, reservations, cancelled] = await Promise.all([
    prisma.resource.findMany({
      where: { isActive: true },
      include: { category: true },
      orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
    }),
    prisma.reservation.findMany({
      where: { status: "CONFIRMED", startTime: { gte: from, lte: to } },
      orderBy: { startTime: "asc" },
    }),
    prisma.reservation.count({
      where: { status: "CANCELLED", startTime: { gte: from, lte: to } },
    }),
  ]);

  // One pass over the bookings to build per-resource statistics
  const stats = new Map<number, Stat>();
  for (const r of resources) {
    stats.set(r.id, { pastCount: 0, pastHours: 0, upCount: 0, upHours: 0, next: null });
  }
  for (const b of reservations) {
    const s = stats.get(b.resourceId);
    if (!s) continue; // inactive resource
    const hours = (b.endTime.getTime() - b.startTime.getTime()) / 3600000;
    if (b.endTime <= now) {
      s.pastCount += 1;
      s.pastHours += hours;
    } else {
      s.upCount += 1;
      s.upHours += hours;
      if (!s.next) s.next = { title: b.title, start: b.startTime, end: b.endTime }; // list is sorted
    }
  }

  const bookingsToday = reservations.filter(
    (b) => b.startTime < todayEnd && b.endTime > todayStart
  ).length;

  let busiest: { name: string; hours: number } | null = null;
  for (const r of resources) {
    const s = stats.get(r.id)!;
    const total = s.pastHours + s.upHours;
    if (total > 0 && (!busiest || total > busiest.hours)) busiest = { name: r.name, hours: total };
  }

  const card = "rounded-xl border bg-white p-4 shadow-sm";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Usage overview</h1>
        <p className="text-sm text-gray-600">
          Confirmed bookings from the last 30 days to the next 30 days (Sri Lanka time).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className={card}>
          <p className="text-xs uppercase text-gray-500">Active resources</p>
          <p className="text-2xl font-semibold">{resources.length}</p>
        </div>
        <div className={card}>
          <p className="text-xs uppercase text-gray-500">Bookings today</p>
          <p className="text-2xl font-semibold">{bookingsToday}</p>
        </div>
        <div className={card}>
          <p className="text-xs uppercase text-gray-500">Cancelled (60-day window)</p>
          <p className="text-2xl font-semibold">{cancelled}</p>
        </div>
        <div className={card}>
          <p className="text-xs uppercase text-gray-500">Busiest resource</p>
          <p className="text-lg font-semibold">{busiest ? busiest.name : "—"}</p>
          {busiest && <p className="text-xs text-gray-500">{busiest.hours.toFixed(1)} h booked</p>}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="p-3">Resource</th>
              <th className="p-3">Category</th>
              <th className="p-3">Past 30 days</th>
              <th className="p-3">Upcoming (30 days)</th>
              <th className="p-3">Next or current booking</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {resources.map((r) => {
              const s = stats.get(r.id)!;
              const idle = s.pastCount + s.upCount === 0;
              return (
                <tr key={r.id}>
                  <td className="p-3 font-medium">
                    {r.name}
                    {idle && (
                      <span className="ml-2 rounded bg-gray-100 px-2 py-0.5 text-xs font-normal text-gray-600">
                        Unused
                      </span>
                    )}
                  </td>
                  <td className="p-3">{r.category.name}</td>
                  <td className="p-3">
                    {s.pastCount} booking(s) · {s.pastHours.toFixed(1)} h
                  </td>
                  <td className="p-3">
                    {s.upCount} booking(s) · {s.upHours.toFixed(1)} h
                  </td>
                  <td className="p-3">
                    {s.next ? (
                      <>
                        <span className="font-medium">{s.next.title}</span>
                        <br />
                        <span className="text-xs text-gray-600">
                          {formatRange(s.next.start, s.next.end)}
                        </span>
                      </>
                    ) : (
                      <span className="text-gray-500">Free</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
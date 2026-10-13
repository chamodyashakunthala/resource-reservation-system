import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatRange } from "@/lib/time";
import { cancelReservation } from "../resources/[id]/actions";

export default async function MyReservationsPage() {
  const user = await requireUser();
  const now = new Date();

  const [upcoming, history] = await Promise.all([
    prisma.reservation.findMany({
      where: { userId: user.id, status: "CONFIRMED", endTime: { gt: now } },
      include: { resource: { include: { category: true } } },
      orderBy: { startTime: "asc" },
    }),
    prisma.reservation.findMany({
      where: {
        userId: user.id,
        OR: [{ status: "CANCELLED" }, { endTime: { lte: now } }],
      },
      include: { resource: true },
      orderBy: { startTime: "desc" },
      take: 20,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">My reservations</h1>
        <p className="text-sm text-gray-600">Your upcoming bookings and recent history.</p>
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold">Upcoming</h2>
        {upcoming.length === 0 ? (
          <div className="rounded-xl border bg-white p-4 text-sm text-gray-600">
            You have no upcoming bookings.{" "}
            <Link href="/" className="text-green-700 underline">
              Browse resources
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {upcoming.map((r) => {
              const inProgress = r.startTime <= now;
              return (
                <li
                  key={r.id}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-xl border bg-white p-4 shadow-sm"
                >
                  <div>
                    <p className="font-medium">
                      {r.title}{" "}
                      {inProgress && (
                        <span className="ml-1 rounded bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800">
                          In progress
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-700">
                      <Link href={`/resources/${r.resourceId}`} className="underline">
                        {r.resource.name}
                      </Link>{" "}
                      · {r.resource.category.name}
                    </p>
                    <p className="text-sm text-gray-600">{formatRange(r.startTime, r.endTime)}</p>
                  </div>
                  <form action={cancelReservation}>
                    <input type="hidden" name="id" value={r.id} />
                    <button className="rounded border px-3 py-1 text-sm hover:bg-gray-50">
                      Cancel booking
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">History</h2>
        {history.length === 0 ? (
          <p className="text-sm text-gray-600">No past bookings yet.</p>
        ) : (
          <ul className="divide-y rounded-xl border bg-white">
            {history.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
                <div>
                  <p className="text-sm font-medium">{r.title}</p>
                  <p className="text-xs text-gray-600">
                    {r.resource.name} · {formatRange(r.startTime, r.endTime)}
                  </p>
                </div>
                <span
                  className={`rounded px-2 py-0.5 text-xs ${
                    r.status === "CANCELLED"
                      ? "bg-gray-100 text-gray-600"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {r.status === "CANCELLED" ? "Cancelled" : "Completed"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
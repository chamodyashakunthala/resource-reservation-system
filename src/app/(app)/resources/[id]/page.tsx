import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatRange } from "@/lib/time";
import BookingForm from "./BookingForm";
import { cancelReservation } from "./actions";

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resourceId = Number(id);
  if (!Number.isInteger(resourceId)) notFound();

  const user = await requireUser();
  const resource = await prisma.resource.findUnique({
    where: { id: resourceId },
    include: { category: true },
  });
  if (!resource || !resource.isActive) notFound();

  const upcoming = await prisma.reservation.findMany({
    where: { resourceId, status: "CONFIRMED", endTime: { gt: new Date() } },
    include: { user: { select: { name: true } } },
    orderBy: { startTime: "asc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm text-green-700 hover:underline">
        ← Back to resources
      </Link>

      <div>
        <h1 className="text-2xl font-semibold">{resource.name}</h1>
        <p className="text-sm text-gray-600">
          {resource.category.name}
          {resource.location ? ` · ${resource.location}` : ""}
          {resource.capacity ? ` · Capacity ${resource.capacity}` : ""}
        </p>
        {resource.description && <p className="mt-2 text-gray-700">{resource.description}</p>}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <BookingForm resourceId={resource.id} />

        <section className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-semibold">Upcoming bookings</h2>
          {upcoming.length === 0 ? (
            <p className="text-sm text-gray-600">No upcoming bookings. This resource is free.</p>
          ) : (
            <ul className="divide-y">
              {upcoming.map((r) => {
                const canCancel = r.userId === user.id || user.role === "ADMIN";
                return (
                  <li key={r.id} className="flex items-start justify-between gap-3 py-3">
                    <div>
                      <p className="text-sm font-medium">{r.title}</p>
                      <p className="text-xs text-gray-600">{formatRange(r.startTime, r.endTime)}</p>
                      <p className="text-xs text-gray-500">Booked by {r.user.name}</p>
                    </div>
                    {canCancel && (
                      <form action={cancelReservation}>
                        <input type="hidden" name="id" value={r.id} />
                        <button className="rounded border px-2 py-1 text-xs hover:bg-gray-50">
                          Cancel
                        </button>
                      </form>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
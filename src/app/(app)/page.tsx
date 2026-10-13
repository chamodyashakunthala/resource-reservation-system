import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const categoryId = Number(category) || undefined;
  const now = new Date();

  const [categories, resources] = await Promise.all([
    prisma.resourceCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.resource.findMany({
      where: { isActive: true, ...(categoryId ? { categoryId } : {}) },
      include: {
        category: true,
        // Is there a confirmed booking happening right now?
        reservations: {
          where: { status: "CONFIRMED", startTime: { lte: now }, endTime: { gt: now } },
          take: 1,
        },
      },
      orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
    }),
  ]);

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1 text-sm ${
      active ? "bg-green-600 text-white border-green-600" : "bg-white hover:bg-gray-50"
    }`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Resources</h1>
        <p className="text-sm text-gray-600">Pick a resource to see its schedule and book it.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/" className={chip(!categoryId)}>All</Link>
        {categories.map((c) => (
          <Link key={c.id} href={`/?category=${c.id}`} className={chip(categoryId === c.id)}>
            {c.name}
          </Link>
        ))}
      </div>

      {resources.length === 0 ? (
        <p className="text-gray-600">No resources found.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((r) => {
            const inUse = r.reservations.length > 0;
            return (
              <div key={r.id} className="flex flex-col rounded-xl border bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold">{r.name}</h2>
                  <span
                    className={`rounded px-2 py-0.5 text-xs ${
                      inUse ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                    }`}
                  >
                    {inUse ? "In use now" : "Available now"}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{r.category.name}</p>
                <p className="mt-2 text-sm text-gray-700">{r.description}</p>
                <p className="mt-2 text-xs text-gray-500">
                  {r.location}
                  {r.capacity ? ` · Capacity ${r.capacity}` : ""}
                </p>
                <Link
                  href={`/resources/${r.id}`}
                  className="mt-4 rounded bg-green-600 py-2 text-center text-sm font-medium text-white"
                >
                  View and book
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
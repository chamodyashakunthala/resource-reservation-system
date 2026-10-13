import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { setResourceActive } from "./actions";

export default async function AdminResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const { error } = await searchParams;
  const now = new Date();

  const resources = await prisma.resource.findMany({
    include: {
      category: true,
      _count: {
        select: { reservations: { where: { status: "CONFIRMED", endTime: { gt: now } } } },
      },
    },
    orderBy: [{ isActive: "desc" }, { category: { name: "asc" } }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Manage resources</h1>
          <p className="text-sm text-gray-600">Add, edit, or deactivate shared resources.</p>
        </div>
        <Link href="/admin/resources/new" className="rounded bg-green-600 px-4 py-2 font-medium text-white">
          Add resource
        </Link>
      </div>

      {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">Location</th>
              <th className="p-3">Capacity</th>
              <th className="p-3">Upcoming</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {resources.map((r) => (
              <tr key={r.id} className={r.isActive ? "" : "bg-gray-50 text-gray-500"}>
                <td className="p-3 font-medium">{r.name}</td>
                <td className="p-3">{r.category.name}</td>
                <td className="p-3">{r.location ?? "—"}</td>
                <td className="p-3">{r.capacity ?? "—"}</td>
                <td className="p-3">{r._count.reservations}</td>
                <td className="p-3">
                  <span
                    className={`rounded px-2 py-0.5 text-xs ${
                      r.isActive ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {r.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/admin/resources/${r.id}`} className="rounded border px-2 py-1 text-xs hover:bg-gray-50">
                      Edit
                    </Link>
                    <form action={setResourceActive}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="active" value={String(!r.isActive)} />
                      <button className="rounded border px-2 py-1 text-xs hover:bg-gray-50">
                        {r.isActive ? "Deactivate" : "Reactivate"}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
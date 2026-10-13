import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import ResourceForm from "../ResourceForm";

export default async function NewResourcePage() {
  await requireAdmin();
  const categories = await prisma.resourceCategory.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Add resource</h1>
      <ResourceForm categories={categories} />
    </div>
  );
}
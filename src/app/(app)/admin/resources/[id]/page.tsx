import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import ResourceForm from "../ResourceForm";

export default async function EditResourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const resourceId = Number(id);
  if (!Number.isInteger(resourceId)) notFound();

  const [resource, categories] = await Promise.all([
    prisma.resource.findUnique({ where: { id: resourceId } }),
    prisma.resourceCategory.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!resource) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Edit {resource.name}</h1>
      <ResourceForm categories={categories} resource={resource} />
    </div>
  );
}
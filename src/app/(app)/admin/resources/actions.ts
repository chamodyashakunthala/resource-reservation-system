"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

type Values = {
  name: string;
  categoryId: string;
  location: string;
  capacity: string;
  description: string;
};

export type ResourceFormState = { error?: string; values?: Values };

export async function saveResource(
  _prev: ResourceFormState,
  formData: FormData
): Promise<ResourceFormState> {
  await requireAdmin();

  const get = (k: string) => String(formData.get(k) ?? "").trim();
  const values: Values = {
    name: get("name"),
    categoryId: get("categoryId"),
    location: get("location"),
    capacity: get("capacity"),
    description: get("description"),
  };
  const fail = (error: string): ResourceFormState => ({ error, values });
  const id = Number(get("id")) || null;

  if (!values.name) return fail("Name is required.");
  if (values.name.length > 80) return fail("Name must be 80 characters or fewer.");
  if (values.location.length > 80) return fail("Location must be 80 characters or fewer.");
  if (values.description.length > 300) return fail("Description must be 300 characters or fewer.");

  const categoryId = Number(values.categoryId);
  const category = await prisma.resourceCategory.findUnique({ where: { id: categoryId } });
  if (!category) return fail("Choose a category.");

  let capacity: number | null = null;
  if (values.capacity) {
    capacity = Number(values.capacity);
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 1000) {
      return fail("Capacity must be a whole number from 1 to 1000.");
    }
  }

  const duplicate = await prisma.resource.findFirst({
    where: {
      categoryId,
      name: { equals: values.name, mode: "insensitive" },
      ...(id ? { id: { not: id } } : {}),
    },
  });
  if (duplicate) {
    return fail(`A resource named "${values.name}" already exists in ${category.name}.`);
  }

  const data = {
    name: values.name,
    categoryId,
    location: values.location || null,
    capacity,
    description: values.description || null,
  };

  if (id) {
    const existing = await prisma.resource.findUnique({ where: { id } });
    if (!existing) return fail("This resource no longer exists.");
    await prisma.resource.update({ where: { id }, data });
    revalidatePath(`/resources/${id}`);
  } else {
    await prisma.resource.create({ data });
  }

  revalidatePath("/");
  revalidatePath("/admin/resources");
  redirect("/admin/resources");
}

export async function setResourceActive(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const active = formData.get("active") === "true";

  const resource = await prisma.resource.findUnique({ where: { id } });
  if (!resource) redirect("/admin/resources");

  if (!active) {
    const upcoming = await prisma.reservation.count({
      where: { resourceId: id, status: "CONFIRMED", endTime: { gt: new Date() } },
    });
    if (upcoming > 0) {
      const msg = `${resource.name} has ${upcoming} upcoming booking(s). Cancel them first, then deactivate it.`;
      redirect(`/admin/resources?error=${encodeURIComponent(msg)}`);
    }
  }

  await prisma.resource.update({ where: { id }, data: { isActive: active } });
  revalidatePath("/");
  revalidatePath("/admin/resources");
  redirect("/admin/resources");
}
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { parseOrgLocal, formatRange } from "@/lib/time";

export type BookingState = {
  error?: string;
  success?: string;
  values?: { title: string; start: string; end: string };
};

const MIN_MINUTES = 15;
const MAX_HOURS = 8;
const MAX_DAYS_AHEAD = 90;

// Detects the PostgreSQL exclusion-constraint violation (code 23P01)
function isOverlapError(e: unknown): boolean {
  const err = e as { message?: string; meta?: unknown; cause?: unknown };
  const text = `${err?.message ?? ""} ${JSON.stringify(err?.meta ?? {})} ${String(err?.cause ?? "")}`;
  return (
    text.includes("reservations_no_overlap") ||
    text.includes("23P01") ||
    text.includes("exclusion constraint")
  );
}

export async function createReservation(
  _prev: BookingState,
  formData: FormData
): Promise<BookingState> {
  // Never trust the client: identify the user on the server
  const user = await requireUser();

  const resourceId = Number(formData.get("resourceId"));
  const title = String(formData.get("title") ?? "").trim();
  const startRaw = String(formData.get("start") ?? "");
  const endRaw = String(formData.get("end") ?? "");
  const values = { title, start: startRaw, end: endRaw };
  const fail = (error: string): BookingState => ({ error, values });

  if (!title) return fail("Please enter a title for the booking.");
  if (title.length > 100) return fail("The title must be 100 characters or fewer.");

  const start = parseOrgLocal(startRaw);
  const end = parseOrgLocal(endRaw);
  if (!start || !end) return fail("Choose both a start and an end time.");
  if (end <= start) return fail("The end time must be after the start time.");

  const minutes = (end.getTime() - start.getTime()) / 60000;
  if (minutes < MIN_MINUTES) return fail(`A booking must be at least ${MIN_MINUTES} minutes.`);
  if (minutes > MAX_HOURS * 60) return fail(`A booking can be at most ${MAX_HOURS} hours.`);

  const now = Date.now();
  if (start.getTime() < now - 5 * 60000) return fail("You can't book a time in the past.");
  if (start.getTime() > now + MAX_DAYS_AHEAD * 86400000)
    return fail(`Bookings can be made up to ${MAX_DAYS_AHEAD} days ahead.`);

  const resource = await prisma.resource.findUnique({ where: { id: resourceId } });
  if (!resource || !resource.isActive) return fail("This resource isn't available for booking.");

  // Layer 1: friendly pre-check that explains the clash
  const clash = await prisma.reservation.findFirst({
    where: {
      resourceId,
      status: "CONFIRMED",
      startTime: { lt: end },
      endTime: { gt: start },
    },
    orderBy: { startTime: "asc" },
  });
  if (clash) {
    return fail(
      `Already booked ${formatRange(clash.startTime, clash.endTime)}. Please choose another time.`
    );
  }

  // Layer 2: the database constraint catches two people booking at the same instant
  try {
    await prisma.reservation.create({
      data: { resourceId, userId: user.id, title, startTime: start, endTime: end },
    });
  } catch (e) {
    if (isOverlapError(e)) return fail("Someone just booked that slot. Please pick another time.");
    throw e;
  }

  revalidatePath(`/resources/${resourceId}`);
  revalidatePath("/reservations");
  return { success: `Confirmed: ${resource.name}, ${formatRange(start, end)}.` };
}

export async function cancelReservation(formData: FormData) {
  const user = await requireUser();
  const id = Number(formData.get("id"));

  const reservation = await prisma.reservation.findUnique({ where: { id } });
  if (!reservation || reservation.status !== "CONFIRMED") return;

  // Only the owner or an admin may cancel
  if (reservation.userId !== user.id && user.role !== "ADMIN") return;

  await prisma.reservation.update({ where: { id }, data: { status: "CANCELLED" } });

  revalidatePath(`/resources/${reservation.resourceId}`);
  revalidatePath("/reservations");
}
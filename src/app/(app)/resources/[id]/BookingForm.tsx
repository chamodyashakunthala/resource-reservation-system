"use client";

import { useActionState } from "react";
import { createReservation, type BookingState } from "./actions";

const initial: BookingState = {};

export default function BookingForm({ resourceId }: { resourceId: number }) {
  const [state, action, pending] = useActionState(createReservation, initial);

  return (
    <form action={action} className="space-y-3 rounded-xl border bg-white p-4 shadow-sm">
      <h2 className="font-semibold">Book this resource</h2>
      <input type="hidden" name="resourceId" value={resourceId} />

      <label className="block text-sm">
        Title
        <input
          name="title"
          required
          maxLength={100}
          defaultValue={state.values?.title}
          placeholder="e.g. Sprint planning"
          className="mt-1 w-full rounded border p-2"
        />
      </label>
      <label className="block text-sm">
        Starts
        <input
          name="start"
          type="datetime-local"
          required
          defaultValue={state.values?.start}
          className="mt-1 w-full rounded border p-2"
        />
      </label>
      <label className="block text-sm">
        Ends
        <input
          name="end"
          type="datetime-local"
          required
          defaultValue={state.values?.end}
          className="mt-1 w-full rounded border p-2"
        />
      </label>

      {state.error && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{state.error}</p>}
      {state.success && (
        <p className="rounded bg-green-50 p-2 text-sm text-green-700">{state.success}</p>
      )}

      <button
        disabled={pending}
        className="w-full rounded bg-green-600 py-2 font-medium text-white disabled:opacity-60"
      >
        {pending ? "Checking availability..." : "Confirm booking"}
      </button>
      <p className="text-xs text-gray-500">
        Times are in Sri Lanka time. Bookings: 15 minutes to 8 hours.
      </p>
    </form>
  );
}
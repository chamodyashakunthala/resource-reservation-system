"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveResource, type ResourceFormState } from "./actions";

type Props = {
  categories: { id: number; name: string }[];
  resource?: {
    id: number;
    name: string;
    categoryId: number;
    location: string | null;
    capacity: number | null;
    description: string | null;
  };
};

export default function ResourceForm({ categories, resource }: Props) {
  const [state, action, pending] = useActionState(saveResource, {} as ResourceFormState);
  const v = state.values;
  const field = "mt-1 w-full rounded border p-2";

  return (
    <form action={action} className="max-w-xl space-y-4 rounded-xl border bg-white p-6 shadow-sm">
      {resource && <input type="hidden" name="id" value={resource.id} />}

      <label className="block text-sm">
        Name
        <input name="name" required maxLength={80} defaultValue={v?.name ?? resource?.name ?? ""} className={field} />
      </label>

      <label className="block text-sm">
        Category
        <select
          name="categoryId"
          required
          defaultValue={v?.categoryId ?? (resource ? String(resource.categoryId) : "")}
          className={field}
        >
          <option value="" disabled>Select a category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          Location
          <input name="location" maxLength={80} defaultValue={v?.location ?? resource?.location ?? ""} className={field} />
        </label>
        <label className="block text-sm">
          Capacity (optional)
          <input
            name="capacity"
            type="number"
            min={1}
            max={1000}
            defaultValue={v?.capacity ?? (resource?.capacity ? String(resource.capacity) : "")}
            className={field}
          />
        </label>
      </div>

      <label className="block text-sm">
        Description
        <textarea
          name="description"
          rows={3}
          maxLength={300}
          defaultValue={v?.description ?? resource?.description ?? ""}
          className={field}
        />
      </label>

      {state.error && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{state.error}</p>}

      <div className="flex gap-3">
        <button disabled={pending} className="rounded bg-green-600 px-4 py-2 font-medium text-white disabled:opacity-60">
          {pending ? "Saving..." : resource ? "Save changes" : "Add resource"}
        </button>
        <Link href="/admin/resources" className="rounded border px-4 py-2 hover:bg-gray-50">
          Cancel
        </Link>
      </div>
    </form>
  );
}
"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const initial: LoginState = {};

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, initial);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <form
        action={action}
        className="w-full max-w-sm bg-white rounded-xl shadow p-6 space-y-4"
      >
        <h1 className="text-2xl font-semibold">Resource Reservations</h1>
        <p className="text-sm text-gray-600">Sign in to book rooms, equipment and vehicles.</p>

        <label className="block text-sm">
          Email
          <input name="email" type="email" required className="mt-1 w-full rounded border p-2" />
        </label>
        <label className="block text-sm">
          Password
          <input name="password" type="password" required className="mt-1 w-full rounded border p-2" />
        </label>

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}

        <button
          disabled={pending}
          className="w-full rounded bg-green-600 py-2 text-white font-medium disabled:opacity-60"
        >
          {pending ? "Signing in..." : "Sign in"}
        </button>

        <p className="text-xs text-gray-500">
          Demo: admin@company.test / Admin@123 &nbsp;|&nbsp; nimal@company.test / Member@123
        </p>
      </form>
    </main>
  );
}
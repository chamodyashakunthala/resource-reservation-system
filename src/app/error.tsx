"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-gray-600">
        We couldn&apos;t complete that request. Please try again.
      </p>
      <button
        onClick={reset}
        className="rounded bg-green-600 px-4 py-2 font-medium text-white"
      >
        Try again
      </button>
    </main>
  );
}
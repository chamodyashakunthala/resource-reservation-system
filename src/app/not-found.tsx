import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-gray-600">
        That page or resource doesn&apos;t exist, or it has been deactivated.
      </p>
      <Link href="/" className="rounded bg-green-600 px-4 py-2 font-medium text-white">
        Back to resources
      </Link>
    </main>
  );
}
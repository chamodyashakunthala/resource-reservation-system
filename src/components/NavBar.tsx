import Link from "next/link";
import { logout } from "@/app/login/actions";

type Props = { user: { name: string; role: "ADMIN" | "MEMBER" } };

export default function NavBar({ user }: Props) {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 p-4">
        <Link href="/" className="font-semibold text-green-700">
          Resource Reservations
        </Link>
        <nav className="flex gap-4 text-sm">
          <Link href="/" className="hover:underline">Resources</Link>
          <Link href="/reservations" className="hover:underline">My reservations</Link>
          {user.role === "ADMIN" && (
  <>
    <Link href="/admin/resources" className="hover:underline">Manage</Link>
    <Link href="/admin/usage" className="hover:underline">Usage</Link>
  </>
)}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm">
          <span>
            {user.name}{" "}
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs">{user.role}</span>
          </span>
          <form action={logout}>
            <button className="rounded border px-3 py-1 hover:bg-gray-50">Sign out</button>
          </form>
        </div>
      </div>
    </header>
  );
}
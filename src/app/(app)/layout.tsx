import NavBar from "@/components/NavBar";
import { requireUser } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Every page inside (app) requires a signed-in user
  const user = await requireUser();
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar user={user} />
      <main className="mx-auto max-w-6xl p-4 sm:p-6">{children}</main>
    </div>
  );
}
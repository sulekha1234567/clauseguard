import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defense in depth: the proxy already guards /dashboard, but we re-check on
  // the server so a page never renders for an unauthenticated request.
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex min-h-full flex-col">
      <Navbar user={session.user} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}

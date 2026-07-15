import { ShieldCheck } from "lucide-react";
import Link from "next/link";

import { Footer } from "@/components/footer";
import { site } from "@/lib/site";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-8 flex items-center justify-center gap-2 text-lg font-semibold"
          >
            <ShieldCheck className="size-6 text-primary" aria-hidden="true" />
            {site.name}
          </Link>
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}

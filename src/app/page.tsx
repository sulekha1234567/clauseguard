import {
  ArrowRight,
  FileSearch,
  MessagesSquare,
  ScanText,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { site } from "@/lib/site";

const FEATURES = [
  {
    icon: ScanText,
    title: "Clause-by-clause breakdown",
    body: "Upload a lease, freelance agreement, or NDA and get every important clause extracted and categorized automatically.",
  },
  {
    icon: ShieldCheck,
    title: "Risk scoring you can trust",
    body: "Each clause is rated low, medium, or high risk from your perspective — with a clear reason and a suggested next step.",
  },
  {
    icon: MessagesSquare,
    title: "Ask questions in plain English",
    body: "Chat with your contract. Answers are grounded strictly in the document, so you never get made-up terms.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <ShieldCheck className="size-6 text-primary" aria-hidden="true" />
          <span>{site.name}</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/register">Get started</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 py-20 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
            <FileSearch className="size-3.5" aria-hidden="true" />
            AI contract review for renters, freelancers &amp; small teams
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
            Understand any contract{" "}
            <span className="text-primary">before you sign.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            {site.name} reads your contract, flags the clauses that could hurt
            you, and explains them in language you actually understand — in
            seconds, not billable hours.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/register">
                Analyze a contract <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login">Try the demo</Link>
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Not legal advice. {site.name} helps you spot issues worth a closer
            look.
          </p>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-4 pb-20">
          <div className="grid gap-6 sm:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-lg border border-border bg-card p-6 shadow-sm"
              >
                <div className="flex size-11 items-center justify-center rounded-lg bg-secondary text-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                <h2 className="mt-4 font-semibold">{title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

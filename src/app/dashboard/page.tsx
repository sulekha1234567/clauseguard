import { FileText } from "lucide-react";
import Link from "next/link";

import { NewContractForm } from "@/components/new-contract-form";
import { RiskBadge } from "@/components/risk-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/authz";
import { formatDate } from "@/lib/utils";
import { listContracts } from "@/server/contracts";

export const metadata = { title: "Dashboard" };

// Always render fresh data for the signed-in user.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const contracts = await listContracts(user);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Your contracts</h1>
        <p className="text-muted-foreground">
          Upload a contract or paste its text to get an instant risk analysis.
        </p>
      </div>

      <NewContractForm />

      <section aria-label="Analyzed contracts">
        {contracts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-primary">
                <FileText className="size-6" aria-hidden="true" />
              </div>
              <p className="font-medium">No contracts yet</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Add your first contract above and ClauseGuard will break it down
                clause by clause.
              </p>
            </CardContent>
          </Card>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {contracts.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/dashboard/contracts/${c.id}`}
                  className="block h-full rounded-lg border border-border bg-card p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-semibold leading-tight">{c.title}</h2>
                    {c.status === "analyzed" && c.overallRisk ? (
                      <RiskBadge level={c.overallRisk} />
                    ) : (
                      <Badge
                        variant={c.status === "failed" ? "outline" : "muted"}
                        className={
                          c.status === "failed" ? "text-destructive" : ""
                        }
                      >
                        {c.status === "processing" ? "Processing…" : "Failed"}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {c.contractType ?? c.fileName}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatDate(c.createdAt)}</span>
                    {c.riskScore != null && (
                      <span className="font-medium">
                        Risk score {c.riskScore}/100
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

import { AlertCircle, ArrowLeft, Lightbulb } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ContractActions } from "@/components/contract-actions";
import { ContractChat } from "@/components/contract-chat";
import { RiskBadge } from "@/components/risk-badge";
import { RiskGauge } from "@/components/risk-gauge";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/authz";
import { AppError } from "@/lib/errors";
import { formatDate } from "@/lib/utils";
import { getContract, getMessages } from "@/server/contracts";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const contract = await getContract(id, user);
    return { title: contract.title };
  } catch {
    return { title: "Contract" };
  }
}

export default async function ContractDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await requireUser();

  let contract: Awaited<ReturnType<typeof getContract>>;
  try {
    contract = await getContract(id, user);
  } catch (err) {
    // 404 for both "missing" and "forbidden" so we don't leak existence (IDOR).
    if (err instanceof AppError && (err.status === 404 || err.status === 403)) {
      notFound();
    }
    throw err;
  }

  const messages = await getMessages(id, user);

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to dashboard
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{contract.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {contract.contractType ?? "Contract"} · {contract.fileName} ·{" "}
            {formatDate(contract.createdAt)}
          </p>
        </div>
        <ContractActions
          id={contract.id}
          title={contract.title}
          status={contract.status}
        />
      </div>

      {contract.status === "failed" && (
        <Card className="border-destructive/40">
          <CardContent className="flex items-start gap-3 py-5">
            <AlertCircle className="mt-0.5 size-5 text-destructive" />
            <div>
              <p className="font-medium">Analysis failed</p>
              <p className="text-sm text-muted-foreground">
                {contract.errorMessage ??
                  "Something went wrong analyzing this contract."}{" "}
                Use “Re-analyze” to try again.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {contract.status === "processing" && (
        <Card>
          <CardContent className="py-5 text-sm text-muted-foreground">
            Analysis in progress… refresh in a moment.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left: summary + clauses */}
        <div className="space-y-6">
          {contract.status === "analyzed" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>Summary</CardTitle>
                  {contract.overallRisk && (
                    <RiskBadge level={contract.overallRisk} />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="text-sm leading-relaxed">{contract.summary}</p>
                {contract.riskScore != null && (
                  <RiskGauge score={contract.riskScore} />
                )}
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">
              Clauses{" "}
              <span className="text-sm font-normal text-muted-foreground">
                ({contract.clauses.length})
              </span>
            </h2>
            {contract.clauses.map((clause) => (
              <Card key={clause.id}>
                <CardContent className="space-y-3 py-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{clause.heading}</h3>
                      <Badge variant="muted">{clause.category}</Badge>
                    </div>
                    <RiskBadge level={clause.riskLevel} />
                  </div>

                  <p className="text-sm leading-relaxed">
                    {clause.plainLanguage}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">
                      Why it matters:{" "}
                    </span>
                    {clause.riskReason}
                  </p>

                  {clause.recommendation && (
                    <p className="flex items-start gap-2 rounded-md bg-secondary p-3 text-sm text-secondary-foreground">
                      <Lightbulb
                        className="mt-0.5 size-4 shrink-0"
                        aria-hidden="true"
                      />
                      <span>{clause.recommendation}</span>
                    </p>
                  )}

                  <details className="group">
                    <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
                      Show original text
                    </summary>
                    <p className="mt-2 whitespace-pre-wrap rounded-md bg-muted p-3 text-xs text-muted-foreground">
                      {clause.originalText}
                    </p>
                  </details>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Right: chat */}
        <div className="lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]">
          <Card className="flex h-full flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Ask about this contract</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col overflow-hidden">
              <ContractChat
                contractId={contract.id}
                initialMessages={messages.map((m) => ({
                  role: m.role,
                  content: m.content,
                }))}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

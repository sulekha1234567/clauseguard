import "server-only";

import { and, asc, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { chatMessages, clauses, contracts } from "@/db/schema";
import { analyzeContract } from "@/lib/ai";
import { type SessionUser } from "@/lib/authz";
import { NotFoundError } from "@/lib/errors";

/* -------------------------------- reads --------------------------------- */

/** All contracts visible to the user (own only, unless admin). */
export async function listContracts(user: SessionUser) {
  const where = user.role === "admin" ? undefined : eq(contracts.userId, user.id);
  return db
    .select({
      id: contracts.id,
      title: contracts.title,
      fileName: contracts.fileName,
      contractType: contracts.contractType,
      status: contracts.status,
      overallRisk: contracts.overallRisk,
      riskScore: contracts.riskScore,
      createdAt: contracts.createdAt,
    })
    .from(contracts)
    .where(where)
    .orderBy(desc(contracts.createdAt));
}

/** A single contract with its clauses, ownership-checked. Throws if missing. */
export async function getContract(id: string, user: SessionUser) {
  const contract = await db.query.contracts.findFirst({
    where: eq(contracts.id, id),
    with: { clauses: { orderBy: (c, { asc }) => asc(c.orderIndex) } },
  });
  // Return 404 (not 403) for someone else's contract so an attacker can't use
  // the response to confirm that a given contract id exists (enumeration).
  if (!contract) throw new NotFoundError("Contract not found.");
  if (user.role !== "admin" && contract.userId !== user.id) {
    throw new NotFoundError("Contract not found.");
  }
  return contract;
}

export async function getMessages(contractId: string, user: SessionUser) {
  // getContract enforces access before we return any messages.
  await getContract(contractId, user);
  return db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.contractId, contractId))
    .orderBy(asc(chatMessages.createdAt));
}

/* ------------------------------- writes --------------------------------- */

/**
 * Create a contract row, run the AI analysis, and persist the extracted
 * clauses — all in one transaction-like flow. The row is created in
 * "processing" and flipped to "analyzed"/"failed" so the UI can reflect state
 * even if the model call fails.
 */
export async function createContract(
  user: SessionUser,
  input: { title: string; contractType?: string; fileName: string; text: string },
) {
  const [created] = await db
    .insert(contracts)
    .values({
      userId: user.id,
      title: input.title,
      contractType: input.contractType,
      fileName: input.fileName,
      rawText: input.text,
      status: "processing",
    })
    .returning();

  try {
    const analysis = await analyzeContract(input.text);

    await db
      .update(contracts)
      .set({
        status: "analyzed",
        summary: analysis.summary,
        overallRisk: analysis.overallRisk,
        riskScore: analysis.riskScore,
        contractType: input.contractType ?? analysis.contractType,
        updatedAt: new Date(),
      })
      .where(eq(contracts.id, created.id));

    if (analysis.clauses.length > 0) {
      await db.insert(clauses).values(
        analysis.clauses.map((c, i) => ({
          contractId: created.id,
          orderIndex: i,
          category: c.category,
          heading: c.heading,
          originalText: c.originalText,
          plainLanguage: c.plainLanguage,
          riskLevel: c.riskLevel,
          riskReason: c.riskReason,
          recommendation: c.recommendation,
        })),
      );
    }
  } catch (err) {
    await db
      .update(contracts)
      .set({
        status: "failed",
        errorMessage:
          err instanceof Error ? err.message : "AI analysis failed unexpectedly.",
        updatedAt: new Date(),
      })
      .where(eq(contracts.id, created.id));
    throw err;
  }

  return created.id;
}

export async function updateContract(
  id: string,
  user: SessionUser,
  data: { title?: string; contractType?: string },
) {
  await getContract(id, user); // authz + existence
  const [updated] = await db
    .update(contracts)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(contracts.id, id))
    .returning();
  return updated;
}

export async function deleteContract(id: string, user: SessionUser) {
  await getContract(id, user); // authz + existence
  await db.delete(contracts).where(eq(contracts.id, id));
}

/** Re-run analysis for a contract (e.g. after a failure). */
export async function reanalyzeContract(id: string, user: SessionUser) {
  const contract = await getContract(id, user);
  await db.delete(clauses).where(eq(clauses.contractId, id));
  await db
    .update(contracts)
    .set({ status: "processing", errorMessage: null, updatedAt: new Date() })
    .where(eq(contracts.id, id));

  const analysis = await analyzeContract(contract.rawText);
  await db
    .update(contracts)
    .set({
      status: "analyzed",
      summary: analysis.summary,
      overallRisk: analysis.overallRisk,
      riskScore: analysis.riskScore,
      updatedAt: new Date(),
    })
    .where(eq(contracts.id, id));

  if (analysis.clauses.length > 0) {
    await db.insert(clauses).values(
      analysis.clauses.map((c, i) => ({
        contractId: id,
        orderIndex: i,
        category: c.category,
        heading: c.heading,
        originalText: c.originalText,
        plainLanguage: c.plainLanguage,
        riskLevel: c.riskLevel,
        riskReason: c.riskReason,
        recommendation: c.recommendation,
      })),
    );
  }
}

export async function saveChatTurn(
  contractId: string,
  userId: string,
  role: "user" | "assistant",
  content: string,
) {
  await db.insert(chatMessages).values({ contractId, userId, role, content });
}

/** Ensure a where clause helper for combined ownership queries (used in tests). */
export const ownContract = (id: string, userId: string) =>
  and(eq(contracts.id, id), eq(contracts.userId, userId));

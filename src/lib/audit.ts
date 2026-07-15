import { headers } from "next/headers";

import { db } from "@/db";
import { auditLogs } from "@/db/schema";

/**
 * Append an entry to the immutable security audit trail. Best-effort: a
 * logging failure must never break the user-facing action, so errors are
 * swallowed after being surfaced to the server console.
 */
export async function audit(params: {
  userId?: string | null;
  action: string;
  resourceId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const h = await headers();
    const ip =
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      h.get("x-real-ip") ??
      null;

    await db.insert(auditLogs).values({
      userId: params.userId ?? null,
      action: params.action,
      resourceId: params.resourceId ?? null,
      ip,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    });
  } catch (err) {
    console.error("[audit] failed to record event", params.action, err);
  }
}

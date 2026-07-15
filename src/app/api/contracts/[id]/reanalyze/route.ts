import { audit } from "@/lib/audit";
import { ok, toErrorResponse } from "@/lib/api";
import { requireUser } from "@/lib/authz";
import { rateLimit } from "@/lib/rate-limit";
import { reanalyzeContract } from "@/server/contracts";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const user = await requireUser();
    rateLimit(`contract:reanalyze:${user.id}`, { limit: 5, windowMs: 60_000 });

    await reanalyzeContract(id, user);
    await audit({ userId: user.id, action: "contract.reanalyze", resourceId: id });

    return ok({ id });
  } catch (err) {
    return toErrorResponse(err);
  }
}

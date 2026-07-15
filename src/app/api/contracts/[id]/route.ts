import { audit } from "@/lib/audit";
import { ok, toErrorResponse } from "@/lib/api";
import { requireUser } from "@/lib/authz";
import { updateContractSchema } from "@/lib/validations";
import {
  deleteContract,
  getContract,
  updateContract,
} from "@/server/contracts";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const contract = await getContract(id, user);
    return ok(contract);
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const user = await requireUser();
    const body = await request.json().catch(() => null);
    const data = updateContractSchema.parse(body);
    const updated = await updateContract(id, user, data);
    await audit({ userId: user.id, action: "contract.update", resourceId: id });
    return ok(updated);
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const user = await requireUser();
    await deleteContract(id, user);
    await audit({ userId: user.id, action: "contract.delete", resourceId: id });
    return ok({ id });
  } catch (err) {
    return toErrorResponse(err);
  }
}

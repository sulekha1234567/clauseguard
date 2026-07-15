import { audit } from "@/lib/audit";
import { ok, toErrorResponse } from "@/lib/api";
import { requireUser } from "@/lib/authz";
import { ValidationError } from "@/lib/errors";
import {
  ALLOWED_MIME,
  MAX_FILE_BYTES,
  extractDocumentText,
  sanitizeText,
} from "@/lib/pdf";
import { rateLimit } from "@/lib/rate-limit";
import { createFromTextSchema, contractInputSchema } from "@/lib/validations";
import { createContract, listContracts } from "@/server/contracts";

export async function GET() {
  try {
    const user = await requireUser();
    const data = await listContracts(user);
    return ok(data);
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    // AI analysis is expensive; cap creations per user per minute.
    rateLimit(`contract:create:${user.id}`, { limit: 8, windowMs: 60_000 });

    const contentType = request.headers.get("content-type") ?? "";
    let payload: {
      title: string;
      contractType?: string;
      fileName: string;
      text: string;
    };

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      const meta = contractInputSchema.parse({
        title: form.get("title"),
        contractType: form.get("contractType") || undefined,
      });

      if (!(file instanceof File)) {
        throw new ValidationError("A file is required.");
      }
      if (file.size > MAX_FILE_BYTES) {
        throw new ValidationError("File exceeds the 5 MB limit.");
      }
      if (!ALLOWED_MIME.includes(file.type as (typeof ALLOWED_MIME)[number])) {
        throw new ValidationError("Only PDF or plain-text files are allowed.");
      }

      const bytes = new Uint8Array(await file.arrayBuffer());
      const text = await extractDocumentText(bytes, file.type);

      payload = {
        title: meta.title,
        contractType: meta.contractType,
        fileName: file.name.slice(0, 200),
        text,
      };
    } else {
      const body = await request.json().catch(() => null);
      const parsed = createFromTextSchema.parse(body);
      payload = {
        title: parsed.title,
        contractType: parsed.contractType,
        fileName: parsed.fileName,
        text: sanitizeText(parsed.text),
      };
    }

    const id = await createContract(user, payload);
    await audit({ userId: user.id, action: "contract.create", resourceId: id });

    return ok({ id }, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}

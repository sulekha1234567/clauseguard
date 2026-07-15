import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";
import { audit } from "@/lib/audit";
import { ok, toErrorResponse } from "@/lib/api";
import { AppError } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    // Throttle by client IP to blunt automated account creation.
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    rateLimit(`register:${ip}`, { limit: 5, windowMs: 60_000 });

    const body = await request.json().catch(() => null);
    const { name, email, password } = registerSchema.parse(body);

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      throw new AppError("An account with this email already exists.", 409, "conflict");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [created] = await db
      .insert(users)
      .values({ name, email, passwordHash })
      .returning({ id: users.id, email: users.email });

    await audit({ userId: created.id, action: "user.register", resourceId: created.id });

    return ok({ id: created.id, email: created.email }, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}

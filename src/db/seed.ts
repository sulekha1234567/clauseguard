import { config } from "dotenv";

// Load env BEFORE importing anything that reads it. Static imports hoist above
// this call, so the db module is pulled in dynamically inside main() instead.
config({ path: ".env.local" });
config();

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function main() {
  const { db } = await import("./index");
  const { clauses, contracts, users } = await import("./schema");

  console.log("🌱 Seeding database...");

  const demoPassword = await bcrypt.hash("Demo1234", 12);
  const adminPassword = await bcrypt.hash("Admin1234", 12);

  const [demo] = await db
    .insert(users)
    .values({
      name: "Demo User",
      email: "demo@clauseguard.app",
      passwordHash: demoPassword,
      role: "user",
    })
    .onConflictDoNothing({ target: users.email })
    .returning();

  await db
    .insert(users)
    .values({
      name: "Admin",
      email: "admin@clauseguard.app",
      passwordHash: adminPassword,
      role: "admin",
    })
    .onConflictDoNothing({ target: users.email });

  // Resolve the demo user id whether it was just created or already existed.
  const [demoUser] =
    demo != null
      ? [demo]
      : await db
          .select()
          .from(users)
          .where(eq(users.email, "demo@clauseguard.app"))
          .limit(1);

  // Only seed a sample contract if the demo user has none yet.
  const existing = await db
    .select({ id: contracts.id })
    .from(contracts)
    .where(eq(contracts.userId, demoUser.id))
    .limit(1);

  if (existing.length === 0) {
    const [sample] = await db
      .insert(contracts)
      .values({
        userId: demoUser.id,
        title: "Sample Apartment Lease",
        fileName: "sample-lease.txt",
        contractType: "Residential Lease",
        status: "analyzed",
        overallRisk: "medium",
        riskScore: 58,
        summary:
          "A 12-month residential lease. Rent and responsibilities are standard, but the automatic renewal, broad late fees, and landlord entry terms deserve attention before signing.",
        rawText:
          "RESIDENTIAL LEASE AGREEMENT. Term: 12 months. Rent: $1,800/month due on the 1st. Late fee: $75 plus $15/day after the 3rd. Security deposit: two months' rent. This lease automatically renews for successive 12-month terms unless either party gives 60 days written notice. Landlord may enter the premises at any time for inspection. Tenant is responsible for all repairs regardless of cause.",
      })
      .returning();

    await db.insert(clauses).values([
      {
        contractId: sample.id,
        orderIndex: 0,
        category: "Renewal",
        heading: "Automatic renewal with 60-day notice",
        originalText:
          "This lease automatically renews for successive 12-month terms unless either party gives 60 days written notice.",
        plainLanguage:
          "If you don't cancel in writing at least 60 days before the term ends, you're locked into another full year.",
        riskLevel: "high",
        riskReason:
          "Auto-renewal for a full 12 months is a large commitment and easy to miss; the 60-day window is longer than many people expect.",
        recommendation:
          "Set a reminder 90 days before the end date, or negotiate month-to-month renewal instead.",
      },
      {
        contractId: sample.id,
        orderIndex: 1,
        category: "Repairs",
        heading: "Tenant responsible for all repairs",
        originalText:
          "Tenant is responsible for all repairs regardless of cause.",
        plainLanguage:
          "You'd have to pay for any repair, even ones that aren't your fault or are the landlord's legal duty.",
        riskLevel: "high",
        riskReason:
          "Shifting all repair costs to the tenant is often unenforceable and financially risky.",
        recommendation:
          "Push to limit tenant responsibility to damage the tenant causes; normal wear and structural issues should be the landlord's.",
      },
      {
        contractId: sample.id,
        orderIndex: 2,
        category: "Payment",
        heading: "Late fees",
        originalText: "Late fee: $75 plus $15/day after the 3rd.",
        plainLanguage:
          "Pay after the 3rd and you owe $75 immediately, plus $15 for every extra day.",
        riskLevel: "medium",
        riskReason:
          "Daily compounding late fees can add up quickly and may exceed local caps.",
        recommendation:
          "Confirm the fees comply with your local rent laws and ask for a short grace period.",
      },
    ]);
    console.log("   • sample contract created for demo@clauseguard.app");
  }

  console.log("✅ Seed complete.");
  console.log("   demo@clauseguard.app / Demo1234  (user)");
  console.log("   admin@clauseguard.app / Admin1234 (admin)");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});

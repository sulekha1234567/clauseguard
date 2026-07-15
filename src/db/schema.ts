import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/* -------------------------------------------------------------------------- */
/*  Enums                                                                     */
/* -------------------------------------------------------------------------- */

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);

export const contractStatusEnum = pgEnum("contract_status", [
  "processing",
  "analyzed",
  "failed",
]);

export const riskLevelEnum = pgEnum("risk_level", ["low", "medium", "high"]);

export const chatRoleEnum = pgEnum("chat_role", ["user", "assistant"]);

/* -------------------------------------------------------------------------- */
/*  Tables                                                                    */
/* -------------------------------------------------------------------------- */

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    role: userRoleEnum("role").notNull().default("user"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("users_email_idx").on(t.email)],
);

export const contracts = pgTable(
  "contracts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    fileName: text("file_name").notNull(),
    contractType: text("contract_type"),
    status: contractStatusEnum("status").notNull().default("processing"),
    // Extracted document text (source of truth for AI grounding).
    rawText: text("raw_text").notNull(),
    // AI-generated high-level summary + overall risk (populated after analysis).
    summary: text("summary"),
    overallRisk: riskLevelEnum("overall_risk"),
    riskScore: integer("risk_score"), // 0-100
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("contracts_user_id_idx").on(t.userId)],
);

export const clauses = pgTable(
  "clauses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    contractId: uuid("contract_id")
      .notNull()
      .references(() => contracts.id, { onDelete: "cascade" }),
    orderIndex: integer("order_index").notNull().default(0),
    category: text("category").notNull(),
    heading: text("heading").notNull(),
    originalText: text("original_text").notNull(),
    plainLanguage: text("plain_language").notNull(),
    riskLevel: riskLevelEnum("risk_level").notNull(),
    riskReason: text("risk_reason").notNull(),
    recommendation: text("recommendation"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("clauses_contract_id_idx").on(t.contractId)],
);

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    contractId: uuid("contract_id")
      .notNull()
      .references(() => contracts.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: chatRoleEnum("role").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("chat_messages_contract_id_idx").on(t.contractId)],
);

/**
 * Immutable security audit trail. Records privileged / sensitive actions so a
 * production operator can answer "who did what to which resource, when".
 */
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(), // e.g. "contract.create"
    resourceId: text("resource_id"),
    ip: text("ip"),
    metadata: text("metadata"), // JSON string
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("audit_logs_user_id_idx").on(t.userId)],
);

/* -------------------------------------------------------------------------- */
/*  Relations                                                                 */
/* -------------------------------------------------------------------------- */

export const usersRelations = relations(users, ({ many }) => ({
  contracts: many(contracts),
}));

export const contractsRelations = relations(contracts, ({ one, many }) => ({
  user: one(users, {
    fields: [contracts.userId],
    references: [users.id],
  }),
  clauses: many(clauses),
  messages: many(chatMessages),
}));

export const clausesRelations = relations(clauses, ({ one }) => ({
  contract: one(contracts, {
    fields: [clauses.contractId],
    references: [contracts.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  contract: one(contracts, {
    fields: [chatMessages.contractId],
    references: [contracts.id],
  }),
}));

/* -------------------------------------------------------------------------- */
/*  Inferred types                                                            */
/* -------------------------------------------------------------------------- */

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Contract = typeof contracts.$inferSelect;
export type NewContract = typeof contracts.$inferInsert;
export type Clause = typeof clauses.$inferSelect;
export type NewClause = typeof clauses.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;

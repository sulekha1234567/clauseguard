import { z } from "zod";

/* -------------------------------------------------------------------------- */
/*  Auth                                                                      */
/* -------------------------------------------------------------------------- */

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128)
    .regex(/[a-z]/, "Include a lowercase letter")
    .regex(/[A-Z]/, "Include an uppercase letter")
    .regex(/[0-9]/, "Include a number"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

/* -------------------------------------------------------------------------- */
/*  Contracts                                                                 */
/* -------------------------------------------------------------------------- */

export const MAX_CONTRACT_CHARS = 60_000;

/** Fields a user may create/update directly (AI-derived fields are not here). */
export const contractInputSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(160),
  contractType: z.string().trim().max(80).optional(),
});

export const updateContractSchema = contractInputSchema.partial();

/** Payload for creating a contract from pasted text (no file upload). */
export const createFromTextSchema = contractInputSchema.extend({
  fileName: z.string().trim().max(200).default("pasted-text.txt"),
  text: z
    .string()
    .trim()
    .min(50, "Provide at least 50 characters of contract text")
    .max(MAX_CONTRACT_CHARS, `Text must be under ${MAX_CONTRACT_CHARS} characters`),
});

/* -------------------------------------------------------------------------- */
/*  Chat                                                                      */
/* -------------------------------------------------------------------------- */

export const chatRequestSchema = z.object({
  message: z.string().trim().min(1, "Message cannot be empty").max(2_000),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ContractInput = z.infer<typeof contractInputSchema>;
export type CreateFromTextInput = z.infer<typeof createFromTextSchema>;

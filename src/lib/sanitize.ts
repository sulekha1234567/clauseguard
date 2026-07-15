import { MAX_CONTRACT_CHARS } from "@/lib/validations";

export const ALLOWED_MIME = ["application/pdf", "text/plain"] as const;
export const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

// ASCII control chars except tab (\x09) and newline (\x0A).
const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

/**
 * Normalize extracted document text: strip control characters, collapse
 * runaway whitespace, and hard-cap length. This both improves AI grounding
 * and prevents oversized / adversarial payloads from reaching the model.
 *
 * Pure & dependency-free so it can be unit-tested without pulling in the PDF
 * parser.
 */
export function sanitizeText(input: string): string {
  return input
    .replace(CONTROL_CHARS, " ")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, MAX_CONTRACT_CHARS);
}

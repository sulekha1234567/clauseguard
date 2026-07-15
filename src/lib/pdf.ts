import { extractText, getDocumentProxy } from "unpdf";

import { sanitizeText } from "@/lib/sanitize";

// Re-export so existing import sites (`@/lib/pdf`) keep working.
export { ALLOWED_MIME, MAX_FILE_BYTES, sanitizeText } from "@/lib/sanitize";

/** Extract plain text from an uploaded PDF or text file buffer. */
export async function extractDocumentText(
  bytes: Uint8Array,
  mime: string,
): Promise<string> {
  if (mime === "text/plain") {
    return sanitizeText(new TextDecoder().decode(bytes));
  }

  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: true });
  const merged = Array.isArray(text) ? text.join("\n") : text;
  const clean = sanitizeText(merged);

  if (clean.length < 50) {
    throw new Error(
      "Could not extract readable text from this PDF. It may be scanned or image-only.",
    );
  }
  return clean;
}

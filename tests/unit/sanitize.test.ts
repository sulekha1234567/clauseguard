import { describe, expect, it } from "vitest";

import { sanitizeText } from "@/lib/sanitize";
import { MAX_CONTRACT_CHARS } from "@/lib/validations";

describe("sanitizeText", () => {
  it("strips control characters", () => {
    const out = sanitizeText("hello\x00\x07world");
    expect(out).not.toMatch(/[\x00-\x08]/);
    expect(out).toContain("hello");
    expect(out).toContain("world");
  });

  it("collapses excessive whitespace and blank lines", () => {
    expect(sanitizeText("a    b")).toBe("a b");
    expect(sanitizeText("a\n\n\n\n\nb")).toBe("a\n\nb");
  });

  it("normalizes CRLF to LF and trims", () => {
    expect(sanitizeText("  a\r\nb  ")).toBe("a\nb");
  });

  it("caps length at MAX_CONTRACT_CHARS", () => {
    const out = sanitizeText("x".repeat(MAX_CONTRACT_CHARS + 500));
    expect(out.length).toBe(MAX_CONTRACT_CHARS);
  });
});

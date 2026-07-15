import { describe, expect, it } from "vitest";

import {
  createFromTextSchema,
  loginSchema,
  registerSchema,
} from "@/lib/validations";

describe("registerSchema", () => {
  it("accepts a strong password and normalizes email", () => {
    const parsed = registerSchema.parse({
      name: "Ada Lovelace",
      email: "Ada@Example.COM",
      password: "Password1",
    });
    expect(parsed.email).toBe("ada@example.com");
  });

  it("rejects weak passwords", () => {
    const res = registerSchema.safeParse({
      name: "Ada",
      email: "ada@example.com",
      password: "alllowercase",
    });
    expect(res.success).toBe(false);
  });

  it("rejects short names", () => {
    const res = registerSchema.safeParse({
      name: "A",
      email: "a@b.com",
      password: "Password1",
    });
    expect(res.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("requires a non-empty password", () => {
    const res = loginSchema.safeParse({ email: "a@b.com", password: "" });
    expect(res.success).toBe(false);
  });
});

describe("createFromTextSchema", () => {
  it("rejects text shorter than 50 chars", () => {
    const res = createFromTextSchema.safeParse({
      title: "Lease",
      text: "too short",
    });
    expect(res.success).toBe(false);
  });

  it("accepts valid input and defaults the file name", () => {
    const parsed = createFromTextSchema.parse({
      title: "Lease",
      text: "x".repeat(60),
    });
    expect(parsed.fileName).toBe("pasted-text.txt");
  });
});

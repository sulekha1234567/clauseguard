import { describe, expect, it } from "vitest";

import { assertCanAccess, type SessionUser } from "@/lib/access";
import { ForbiddenError } from "@/lib/errors";

const owner: SessionUser = {
  id: "user-1",
  name: "Owner",
  email: "owner@x.com",
  role: "user",
};
const other: SessionUser = {
  id: "user-2",
  name: "Other",
  email: "other@x.com",
  role: "user",
};
const admin: SessionUser = {
  id: "admin-1",
  name: "Admin",
  email: "admin@x.com",
  role: "admin",
};

describe("assertCanAccess", () => {
  it("allows the owner", () => {
    expect(() => assertCanAccess("user-1", owner)).not.toThrow();
  });

  it("allows an admin to access anyone's resource", () => {
    expect(() => assertCanAccess("user-1", admin)).not.toThrow();
  });

  it("blocks a different non-admin user (IDOR protection)", () => {
    expect(() => assertCanAccess("user-1", other)).toThrow(ForbiddenError);
  });
});

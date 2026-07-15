import { ZodError } from "zod";

import { AppError, ValidationError } from "@/lib/errors";

/** Standard JSON success response. */
export function ok<T>(data: T, init?: ResponseInit) {
  return Response.json({ data }, { status: 200, ...init });
}

/**
 * Convert any thrown error into a safe JSON error response. Known AppErrors
 * expose their message; anything else is logged and returned as a generic 500
 * so internal details never leak to the client.
 */
export function toErrorResponse(err: unknown): Response {
  if (err instanceof ZodError) {
    return Response.json(
      { error: { code: "validation_error", message: "Invalid input.", issues: err.issues } },
      { status: 422 },
    );
  }

  if (err instanceof ValidationError) {
    return Response.json(
      { error: { code: err.code, message: err.message, details: err.details } },
      { status: err.status },
    );
  }

  if (err instanceof AppError) {
    return Response.json(
      { error: { code: err.code, message: err.message } },
      { status: err.status },
    );
  }

  console.error("[api] unhandled error:", err);
  return Response.json(
    { error: { code: "internal_error", message: "Something went wrong." } },
    { status: 500 },
  );
}

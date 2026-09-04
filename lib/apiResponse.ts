import { NextResponse } from "next/server";
import type { ZodError } from "zod";

/** Every route handler's Zod-failure response — same shape, same 400, everywhere. */
export function validationErrorResponse(error: ZodError) {
  return NextResponse.json(
    { error: "invalid_request", message: error.issues[0]?.message ?? "Invalid request" },
    { status: 400 },
  );
}

/**
 * Looks up a result key (e.g. a domain outcome like "slot_full" or "forbidden") in a
 * route-local map of {status, message} and returns the matching JSON response. Keeps each
 * route's map as its own source of truth for what its outcomes mean, while sharing the
 * lookup-and-respond mechanics that were otherwise repeated per route.
 */
export function mappedErrorResponse<T extends string>(
  map: Record<T, { status: number; message: string }>,
  key: T,
) {
  const { status, message } = map[key];
  return NextResponse.json({ error: key, message }, { status });
}

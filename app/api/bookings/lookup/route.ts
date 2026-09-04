import { NextRequest, NextResponse } from "next/server";
import { lookupBookingSchema } from "@/lib/validation";
import { findBookingsByReferenceAndEmail } from "@/lib/booking";
import { toBookingView } from "@/lib/bookingView";
import { validationErrorResponse } from "@/lib/apiResponse";

export async function GET(request: NextRequest) {
  const parsed = lookupBookingSchema.safeParse({
    referenceCode: request.nextUrl.searchParams.get("referenceCode"),
    email: request.nextUrl.searchParams.get("email"),
  });
  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  const rows = await findBookingsByReferenceAndEmail(parsed.data.referenceCode, parsed.data.email);
  // Deliberately the same response shape whether the reference doesn't exist or the email just
  // doesn't match it — a different message for "wrong email" vs "no such reference" would let
  // someone confirm a reference code is real without knowing the email on it.
  return NextResponse.json({ bookings: rows.map(toBookingView) });
}

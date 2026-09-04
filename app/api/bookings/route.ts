import { NextRequest, NextResponse } from "next/server";
import { createBookingSchema } from "@/lib/validation";
import { createBooking } from "@/lib/booking";
import { verifyTurnstile } from "@/lib/turnstile";
import { isRateLimited, getClientIp } from "@/lib/rateLimit";
import { MY_BOOKINGS_COOKIE, addBookingIdToCookie } from "@/lib/cookies";
import { validationErrorResponse, mappedErrorResponse } from "@/lib/apiResponse";

// Keyed by the union `lib/booking.ts` actually returns — a missing or misspelled reason here is
// a compile error, not a runtime KeyError.
const REASON_TO_RESPONSE: Record<
  "slot_not_found" | "slot_full" | "already_booked",
  { status: number; message: string }
> = {
  slot_not_found: { status: 404, message: "That sitting no longer exists." },
  slot_full: {
    status: 409,
    message: "Those seats just went. The list below has been refreshed — try another sitting.",
  },
  already_booked: {
    status: 409,
    message: "This email already has a booking for that sitting.",
  },
};

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);

  const json = await request.json().catch(() => null);
  const parsed = createBookingSchema.safeParse(json);
  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  if (await isRateLimited(ip)) {
    return NextResponse.json(
      { error: "rate_limited", message: "Too many booking attempts. Try again in a few minutes." },
      { status: 429 },
    );
  }

  const turnstileOk = await verifyTurnstile(parsed.data.turnstileToken ?? null, ip);
  if (!turnstileOk) {
    return NextResponse.json(
      { error: "captcha_failed", message: "Verification failed. Please try again." },
      { status: 400 },
    );
  }

  const result = await createBooking({
    slotId: parsed.data.slotId,
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone,
    partySize: parsed.data.partySize,
    ip,
  });

  if (!result.ok) {
    return mappedErrorResponse(REASON_TO_RESPONSE, result.reason);
  }

  const response = NextResponse.json({
    id: result.id,
    referenceCode: result.referenceCode,
  });
  const existingCookie = request.cookies.get(MY_BOOKINGS_COOKIE)?.value;
  response.cookies.set(MY_BOOKINGS_COOKIE, addBookingIdToCookie(existingCookie, result.id), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return response;
}

import { NextRequest, NextResponse } from "next/server";
import { findBookingsByCookieIds } from "@/lib/booking";
import { toBookingView } from "@/lib/bookingView";
import { MY_BOOKINGS_COOKIE, parseBookingIdsCookie } from "@/lib/cookies";

export async function GET(request: NextRequest) {
  const ids = parseBookingIdsCookie(request.cookies.get(MY_BOOKINGS_COOKIE)?.value);
  const rows = await findBookingsByCookieIds(ids);
  return NextResponse.json({ bookings: rows.map(toBookingView) });
}

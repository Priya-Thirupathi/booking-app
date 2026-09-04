import { NextRequest, NextResponse } from "next/server";
import { cancelBookingSchema } from "@/lib/validation";
import { cancelBooking, type BookingRow } from "@/lib/booking";
import { canCancel } from "@/lib/canCancel";

const RESULT_TO_RESPONSE: Record<string, { status: number; message: string }> = {
  not_found: { status: 404, message: "Booking not found." },
  forbidden: { status: 403, message: "That email doesn't match this booking." },
  policy_blocked: { status: 409, message: "This booking can no longer be cancelled." },
};

export async function POST(
  request: NextRequest,
  { params }: RouteContext<"/api/bookings/[id]/cancel">,
) {
  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = cancelBookingSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", message: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  const isAllowed = (booking: BookingRow) =>
    canCancel({
      status: booking.status,
      sittingDate: booking.date,
      sittingStartTime: booking.start_time,
      sittingTimezone: booking.timezone,
    });

  const result = await cancelBooking(id, parsed.data.email, isAllowed);
  if (result !== "ok") {
    const mapped = RESULT_TO_RESPONSE[result];
    return NextResponse.json({ error: result, message: mapped.message }, { status: mapped.status });
  }
  return NextResponse.json({ ok: true });
}

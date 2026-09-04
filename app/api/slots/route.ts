import { NextRequest, NextResponse } from "next/server";
import { slotsQuerySchema } from "@/lib/validation";
import { findSlotsForDate, findNextAvailableDate } from "@/lib/slots";
import { validationErrorResponse } from "@/lib/apiResponse";

export async function GET(request: NextRequest) {
  const parsed = slotsQuerySchema.safeParse({
    date: request.nextUrl.searchParams.get("date"),
    partySize: request.nextUrl.searchParams.get("partySize") ?? undefined,
  });
  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  const slots = await findSlotsForDate(parsed.data.date);
  if (slots.length === 0) {
    const nextDate = await findNextAvailableDate(parsed.data.date);
    return NextResponse.json({ slots: [], nextAvailableDate: nextDate });
  }

  return NextResponse.json({
    slots: slots.map((s) => ({
      id: s.id,
      date: s.date,
      startTime: s.start_time,
      timezone: s.timezone,
      capacity: s.capacity,
      seatsRemaining: s.capacity - s.seats_taken,
      // Available only if the party actually fits — a slot with 2 seats left is not a real
      // option for a party of 4 (PRD). The client still shows it, disabled, not hidden.
      fitsParty: parsed.data.partySize
        ? s.capacity - s.seats_taken >= parsed.data.partySize
        : true,
    })),
  });
}

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { DateField } from "./date-field";
import { PartySizeSelect } from "./party-size-select";
import { SlotList, type SlotListState } from "./slot-list";
import { BookingDialog } from "./booking-dialog";
import { fetchSlots, getErrorMessage, type SlotView } from "@/lib/apiClient";
import { todayInViewerTimezone } from "@/lib/formatSitting";
import { useAsyncState } from "@/lib/useAsyncState";

// Pure — no setState inside — so useAsyncState's mount effect only ever sets state inside a
// `.then()` callback, never synchronously in the effect body (satisfies react-hooks/set-state-in-effect).
async function loadSlots(date: string, partySize: number): Promise<SlotListState> {
  try {
    const res = await fetchSlots(date, partySize);
    return { status: "loaded", slots: res.slots, nextAvailableDate: res.nextAvailableDate ?? null };
  } catch (err) {
    return { status: "error", message: getErrorMessage(err, "Couldn't load sittings.") };
  }
}

export function BookingFlow() {
  const [date, setDate] = useState(todayInViewerTimezone);
  const [partySize, setPartySize] = useState(2);
  const [selectedSlot, setSelectedSlot] = useState<SlotView | null>(null);

  const { state: listState, refresh } = useAsyncState<SlotListState>(
    () => loadSlots(date, partySize),
    { status: "loading" },
    [date, partySize],
  );

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-8 sm:py-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Book a table</h1>
        <p className="text-sm text-muted-foreground">
          Pick a date and party size to see what&apos;s open.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <DateField value={date} onChange={setDate} />
        <PartySizeSelect value={partySize} onChange={setPartySize} />
      </div>

      <SlotList state={listState} onSelect={setSelectedSlot} onJumpToDate={setDate} onRetry={refresh} />

      <BookingDialog
        slot={selectedSlot}
        partySize={partySize}
        onClose={() => setSelectedSlot(null)}
        onBooked={() => {
          toast.success("Booking confirmed");
          refresh(); // the booked slot's remaining seats just changed — don't go stale
        }}
      />
    </div>
  );
}

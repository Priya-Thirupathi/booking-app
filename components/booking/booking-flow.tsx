"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DateField } from "./date-field";
import { PartySizeSelect } from "./party-size-select";
import { SlotList, type SlotListState } from "./slot-list";
import { BookingDialog } from "./booking-dialog";
import { fetchSlots, ApiError, type SlotView } from "@/lib/apiClient";
import { todayInViewerTimezone } from "@/lib/formatSitting";

// A pure fetch — no setState inside it — used by both the mount/change effect and the retry
// button. Keeping it setState-free (rather than a `load()` that calls setState itself) is what
// lets the effect below satisfy react-hooks/set-state-in-effect: state only ever changes inside
// a `.then()` callback, never synchronously in the effect body.
async function loadSlots(date: string, partySize: number): Promise<SlotListState> {
  try {
    const res = await fetchSlots(date, partySize);
    return { status: "loaded", slots: res.slots, nextAvailableDate: res.nextAvailableDate ?? null };
  } catch (err) {
    return {
      status: "error",
      message: err instanceof ApiError ? err.message : "Couldn't load sittings.",
    };
  }
}

export function BookingFlow() {
  const [date, setDate] = useState(todayInViewerTimezone);
  const [partySize, setPartySize] = useState(2);
  const [listState, setListState] = useState<SlotListState>({ status: "loading" });
  const [selectedSlot, setSelectedSlot] = useState<SlotView | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadSlots(date, partySize).then((result) => {
      if (!cancelled) setListState(result);
    });
    // Guards against a slow response for a since-changed date/party-size overwriting a newer
    // one — without this, switching dates quickly could show stale slots.
    return () => {
      cancelled = true;
    };
  }, [date, partySize]);

  function refresh() {
    setListState({ status: "loading" });
    loadSlots(date, partySize).then(setListState);
  }

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

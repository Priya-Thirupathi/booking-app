"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/error-banner";
import { SlotRow } from "./slot-row";
import type { SlotView } from "@/lib/apiClient";

// "loaded" covers both the success and empty states — an empty `slots` array with
// `nextAvailableDate` set renders the PRD's empty-state treatment below.
export type SlotListState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "loaded"; slots: SlotView[]; nextAvailableDate: string | null };

export function SlotList({
  state,
  onSelect,
  onJumpToDate,
  onRetry,
}: {
  state: SlotListState;
  onSelect: (slot: SlotView) => void;
  onJumpToDate: (date: string) => void;
  onRetry: () => void;
}) {
  if (state.status === "loading") {
    return (
      <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading sittings">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[60px] w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (state.status === "error") {
    return <ErrorBanner message={state.message} onRetry={onRetry} />;
  }

  if (state.slots.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-lg border border-border p-4">
        <p className="text-sm text-muted-foreground">No sittings on this date.</p>
        {state.nextAvailableDate && (
          <Button variant="outline" size="sm" onClick={() => onJumpToDate(state.nextAvailableDate!)}>
            See next available date
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {state.slots.map((slot) => (
        <SlotRow key={slot.id} slot={slot} onSelect={onSelect} />
      ))}
    </div>
  );
}

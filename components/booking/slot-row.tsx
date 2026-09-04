"use client";

import { Badge } from "@/components/ui/badge";
import { formatSittingTime } from "@/lib/formatSitting";
import type { SlotView } from "@/lib/apiClient";
import { cn } from "@/lib/utils";

export function SlotRow({ slot, onSelect }: { slot: SlotView; onSelect: (slot: SlotView) => void }) {
  const { restaurantLabel, viewerLabel } = formatSittingTime(slot.date, slot.startTime, slot.timezone);
  const disabled = !slot.fitsParty;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(slot)}
      aria-label={
        disabled
          ? `${restaurantLabel}, not enough seats for your party`
          : `Book ${restaurantLabel}, ${slot.seatsRemaining} seats left`
      }
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-lg border border-border px-4 py-3 text-left transition-colors",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "hover:border-ring hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none",
      )}
    >
      <div className="flex flex-col">
        <span className="font-medium">{restaurantLabel}</span>
        {viewerLabel && (
          <span className="text-xs text-muted-foreground">{viewerLabel} your time</span>
        )}
      </div>
      <Badge variant={disabled ? "outline" : slot.seatsRemaining <= 2 ? "destructive" : "secondary"}>
        {disabled ? "Not enough seats" : `${slot.seatsRemaining} left`}
      </Badge>
    </button>
  );
}

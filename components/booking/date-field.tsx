"use client";

import { Label } from "@/components/ui/label";
import { todayInViewerTimezone } from "@/lib/formatSitting";

// Native <input type="date"> rather than a custom calendar widget: it invokes the OS's own date
// picker on a phone (the PRD's stated context — "arrives from a link, on a phone, in a hurry"),
// which is faster to use and free of the keyboard-nav/aria bugs a hand-rolled calendar risks
// under this timeline.
export function DateField({ value, onChange }: { value: string; onChange: (date: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="sitting-date">Date</Label>
      <input
        id="sitting-date"
        type="date"
        value={value}
        min={todayInViewerTimezone()}
        onChange={(e) => onChange(e.target.value)}
        className="border-input bg-background flex h-8 w-full rounded-lg border px-2.5 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:w-44"
      />
    </div>
  );
}

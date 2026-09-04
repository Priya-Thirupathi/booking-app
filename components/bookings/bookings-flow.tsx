"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BookingCard } from "./booking-card";
import { LookupForm } from "./lookup-form";
import { fetchMyBookings, ApiError } from "@/lib/apiClient";
import { zonedTimeToUtcMs } from "@/lib/time";
import type { BookingView } from "@/lib/bookingView";

type ListState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "loaded"; bookings: BookingView[] };

function sittingMs(b: BookingView) {
  return zonedTimeToUtcMs(b.date, b.startTime, b.timezone);
}

// Pure — no setState inside — so the mount effect below only ever sets state inside a `.then()`
// callback, never synchronously in the effect body (see the identical note in booking-flow.tsx).
async function loadMyBookings(): Promise<ListState> {
  try {
    const res = await fetchMyBookings();
    return { status: "loaded", bookings: res.bookings };
  } catch (err) {
    return {
      status: "error",
      message: err instanceof ApiError ? err.message : "Couldn't load your bookings.",
    };
  }
}

export function BookingsFlow() {
  const [state, setState] = useState<ListState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    loadMyBookings().then((result) => {
      if (!cancelled) setState(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function refresh() {
    setState({ status: "loading" });
    loadMyBookings().then(setState);
  }

  function mergeFound(found: BookingView[]) {
    setState((prev) => {
      const existing = prev.status === "loaded" ? prev.bookings : [];
      const byId = new Map(existing.map((b) => [b.id, b]));
      for (const b of found) byId.set(b.id, b);
      return { status: "loaded", bookings: Array.from(byId.values()) };
    });
  }

  function handleCancelled(id: string) {
    setState((prev) => {
      if (prev.status !== "loaded") return prev;
      return {
        status: "loaded",
        bookings: prev.bookings.map((b) => (b.id === id ? { ...b, status: "cancelled", canCancel: false } : b)),
      };
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-8 sm:py-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">My bookings</h1>
        <p className="text-sm text-muted-foreground">Bookings made on this device appear automatically.</p>
      </div>

      {state.status === "loading" && (
        <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading your bookings">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      )}

      {state.status === "error" && (
        <div className="flex flex-col items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">{state.message}</p>
          <Button variant="outline" size="sm" onClick={refresh}>
            Try again
          </Button>
        </div>
      )}

      {state.status === "loaded" && <BookingGroups bookings={state.bookings} onCancelled={handleCancelled} />}

      <LookupForm onFound={mergeFound} />
    </div>
  );
}

function BookingGroups({
  bookings,
  onCancelled,
}: {
  bookings: BookingView[];
  onCancelled: (id: string) => void;
}) {
  if (bookings.length === 0) {
    return (
      <div className="rounded-lg border border-border p-4">
        <p className="text-sm text-muted-foreground">
          No bookings yet.{" "}
          <Link href="/" className="text-foreground underline underline-offset-2">
            Book a table
          </Link>
        </p>
      </div>
    );
  }

  const upcoming = bookings.filter((b) => !b.isPast).sort((a, b) => sittingMs(a) - sittingMs(b));
  const past = bookings.filter((b) => b.isPast).sort((a, b) => sittingMs(b) - sittingMs(a));

  return (
    <div className="flex flex-col gap-6">
      {upcoming.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">Upcoming</h2>
          {upcoming.map((b) => (
            <BookingCard key={b.id} booking={b} onCancelled={onCancelled} />
          ))}
        </section>
      )}
      {past.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">Past</h2>
          {past.map((b) => (
            <BookingCard key={b.id} booking={b} onCancelled={onCancelled} />
          ))}
        </section>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorBanner } from "@/components/error-banner";
import { lookupBookings, getErrorMessage } from "@/lib/apiClient";
import type { BookingView } from "@/lib/bookingView";

export function LookupForm({ onFound }: { onFound: (bookings: BookingView[]) => void }) {
  const [referenceCode, setReferenceCode] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { bookings } = await lookupBookings(referenceCode, email);
      if (bookings.length === 0) {
        // Same message whether the reference is wrong or the email doesn't match it — see
        // app/api/bookings/lookup/route.ts for why that's deliberate, not an oversight.
        setError("No booking found for that reference and email.");
      } else {
        onFound(bookings);
        setReferenceCode("");
        setEmail("");
      }
    } catch (err) {
      setError(getErrorMessage(err, "Something went wrong. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-medium">Booked on another device?</h2>
        <p className="text-xs text-muted-foreground">Look it up with your reference and email.</p>
      </div>
      {error && <ErrorBanner message={error} compact />}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="lookup-reference">Reference</Label>
          <Input
            id="lookup-reference"
            value={referenceCode}
            onChange={(e) => setReferenceCode(e.target.value)}
            disabled={loading}
            placeholder="e.g. 7QK9M2X"
          />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="lookup-email">Email</Label>
          <Input
            id="lookup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>
      <Button type="submit" variant="outline" disabled={loading} className="self-start">
        {loading ? "Looking up…" : "Find booking"}
      </Button>
    </form>
  );
}

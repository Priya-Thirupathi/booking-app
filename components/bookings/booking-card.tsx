"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CopyButton } from "@/components/copy-button";
import { formatSittingTime } from "@/lib/formatSitting";
import { cancelBookingRequest, getErrorMessage } from "@/lib/apiClient";
import { guestWord } from "@/lib/pluralize";
import type { BookingView } from "@/lib/bookingView";

export function BookingCard({
  booking,
  onCancelled,
}: {
  booking: BookingView;
  onCancelled: (id: string) => void;
}) {
  const [cancelling, setCancelling] = useState(false);
  const { restaurantLabel, viewerLabel } = formatSittingTime(
    booking.date,
    booking.startTime,
    booking.timezone,
  );

  async function handleCancel() {
    setCancelling(true);
    try {
      await cancelBookingRequest(booking.id, booking.email);
      toast.success("Booking cancelled");
      onCancelled(booking.id);
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't cancel this booking."));
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <span className="font-medium">{restaurantLabel}</span>
          {viewerLabel && <span className="text-xs text-muted-foreground">{viewerLabel} your time</span>}
          <span className="text-xs text-muted-foreground">
            {booking.partySize} {guestWord(booking.partySize)} · {booking.name}
          </span>
        </div>
        <Badge variant={booking.status === "cancelled" ? "outline" : "secondary"}>
          {booking.status === "cancelled" ? "Cancelled" : booking.isPast ? "Past" : "Upcoming"}
        </Badge>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Reference</span>
          <span className="font-mono text-sm font-medium tracking-wide">{booking.referenceCode}</span>
        </div>
        <div className="flex gap-2">
          <CopyButton value={booking.referenceCode} />
          {booking.canCancel && (
            <AlertDialog>
              <AlertDialogTrigger render={<Button variant="destructive" size="sm" disabled={cancelling} />}>
                Cancel
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {restaurantLabel} for {booking.partySize} {guestWord(booking.partySize)}. This
                    can&apos;t be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep booking</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCancel}>Cancel booking</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </div>
  );
}

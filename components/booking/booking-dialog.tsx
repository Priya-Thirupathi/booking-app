"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CopyButton } from "@/components/copy-button";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { ErrorBanner } from "@/components/error-banner";
import { createBookingRequest, getErrorMessage, type SlotView } from "@/lib/apiClient";
import { createBookingSchema } from "@/lib/validation";
import { formatSittingTime } from "@/lib/formatSitting";
import { guestWord } from "@/lib/pluralize";

interface FormValues {
  name: string;
  email: string;
  phone: string;
}

const EMPTY_FORM: FormValues = { name: "", email: "", phone: "" };

export function BookingDialog({
  slot,
  partySize,
  onClose,
  onBooked,
}: {
  slot: SlotView | null;
  partySize: number;
  onClose: () => void;
  onBooked: () => void;
}) {
  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{ referenceCode: string } | null>(null);

  function reset() {
    setValues(EMPTY_FORM);
    setFieldErrors({});
    setServerError(null);
    setSubmitting(false);
    setConfirmation(null);
  }

  function handleClose() {
    if (confirmation) onBooked();
    reset();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!slot) return;
    setServerError(null);

    const parsed = createBookingSchema.safeParse({
      slotId: slot.id,
      partySize,
      turnstileToken,
      ...values,
    });
    if (!parsed.success) {
      const errors: Partial<Record<keyof FormValues, string>> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof FormValues;
        if (field) errors[field] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    try {
      const result = await createBookingRequest(parsed.data);
      setConfirmation({ referenceCode: result.referenceCode });
    } catch (err) {
      // Field-level errors are for validation; a failed submit (slot taken, duplicate booking,
      // rate limit) is a banner, not attributed to any one field — the PRD's states table calls
      // this out specifically: the diner must be told the seats went, not shown a blank retry.
      setServerError(getErrorMessage(err, "Something went wrong. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  const sittingLabel = slot ? formatSittingTime(slot.date, slot.startTime, slot.timezone) : null;

  return (
    <Dialog open={slot !== null} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        {confirmation ? (
          <>
            <DialogHeader>
              <DialogTitle>You&apos;re booked</DialogTitle>
              <DialogDescription>
                {sittingLabel?.restaurantLabel} · {partySize} {guestWord(partySize)}
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/50 p-4">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Booking reference</span>
                <span className="font-mono text-lg font-semibold tracking-wide">
                  {confirmation.referenceCode}
                </span>
              </div>
              <CopyButton value={confirmation.referenceCode} />
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Book this sitting</DialogTitle>
              <DialogDescription>
                {sittingLabel?.restaurantLabel} · {partySize} {guestWord(partySize)}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-4">
              {serverError && <ErrorBanner message={serverError} compact />}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  autoComplete="name"
                  value={values.name}
                  onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
                  aria-invalid={!!fieldErrors.name}
                  disabled={submitting}
                />
                {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={values.email}
                  onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
                  aria-invalid={!!fieldErrors.email}
                  disabled={submitting}
                />
                {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  value={values.phone}
                  onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))}
                  aria-invalid={!!fieldErrors.phone}
                  disabled={submitting}
                />
                {fieldErrors.phone && <p className="text-xs text-destructive">{fieldErrors.phone}</p>}
              </div>
              <TurnstileWidget onToken={setTurnstileToken} />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                {submitting ? "Booking…" : "Confirm booking"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

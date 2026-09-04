# PRD: Table booking

## Problem

A restaurant publishes its available sittings. A diner needs to find a time that fits their
party, book it in under a minute without creating an account, and be able to find that booking
again later. The restaurant needs to never be oversold, and needs some protection against junk
bookings now that there is no login standing in the way.

## Who it is for

**The diner.** Arrives from a link, on a phone, probably in a hurry. Has no account and will
not make one. Wants to see what is free tonight, pick a time, and get a confirmation they can
show at the door.

**The restaurant.** Not a user of this build (no staff screen in scope), but every rule in it
exists to protect their covers. Overselling a sitting is the only truly unacceptable failure.

## Scope

Two screens.

### 1. Find and book

- Pick a date. Defaults to today.
- Pick a party size before seeing slots, because a slot with 2 seats left is not available to
  a party of 4 and should not be offered as though it were.
- See every sitting for that date with its remaining capacity. Sittings that cannot take the
  party are visible but disabled, not hidden. Hiding them makes the restaurant look closed.
- Book with name, email, phone. No password, no account.
- Get a confirmation with a booking reference.

### 2. My bookings

- Upcoming and past, split, most recent first.
- Works immediately for anyone booking on this device, with no lookup step.
- A lookup by reference and email for anyone on a different device.

## Rules

**Capacity.** A sitting holds a fixed number of covers. A booking takes its party size out of
that pool. The pool can reach zero but never go below it.

**Conflict.** No held or reserved slots. Whoever confirms first gets the seats. The other diner
gets a clear message naming what happened and a list that has already refreshed, so their next
attempt is against real availability rather than a stale screen.

**Cancellation.** Behind a single policy decision, pending confirmation from the stakeholder.
The brief lists cancellation as required, the clarification says it should not be possible.
Both readings are supported by one function, so the live behaviour is a configuration choice
rather than a feature.

**Identity without accounts.** A booking reference plus the diner's email is the credential.
The reference is remembered in the browser so the common case needs no typing at all. Knowing
a reference alone is not enough to see or change a booking, the email must match.

**Time.** Sittings display in the restaurant's own timezone with the zone named on screen,
because the diner is physically travelling to the restaurant. Showing a diner their own local
time for a place they will walk into is actively misleading. Where the viewer's zone differs,
their local equivalent is shown underneath as secondary text.

**Abuse.** With no login there is no natural cost to a fake booking, so four cheap barriers
rather than one: a captcha challenge on submit, a rate limit per IP, one email cannot hold two
live bookings for the same sitting, and a cap on party size.

## States

Every list and every action has all four, and they are part of the deliverable, not polish
added if time allows.

| Surface | Loading | Empty | Error | Success |
|---|---|---|---|---|
| Slot list | Skeleton rows, no layout shift | "No sittings on this date" with the next available date offered | Inline retry, the date stays selected | n/a |
| Booking submit | Button disabled and spinning, form locked | n/a | Field level for validation, banner for server errors, nothing retyped | Confirmation with reference, copyable |
| My bookings | Skeleton rows | "No bookings yet" with a link to book | Retry | n/a |
| Cancel | Button spinning | n/a | Reason named, not "something went wrong" | Row updates in place, marked cancelled |

The one that matters most is the slot that fills between page load and submit. The diner must
be told the seats went, not handed a generic failure.

## Non-goals

Named deliberately, each with the reason, rather than left silently undone.

- **Payments and deposits.** Not in the brief.
- **Staff screen for setting availability.** Confirmed out of scope with the stakeholder.
  Sittings are seeded.
- **Rescheduling.** Cancel and rebook covers it at a fraction of the complexity.
- **Email and SMS confirmation.** Correct next feature, needs a mail provider and a verified
  sending domain, which is more setup than the remaining time allows.
- **Waitlist for full sittings.** The obvious follow-on once bookings exist.
- **Multiple restaurants.** The schema does not prevent it, the UI assumes one.

## Done means

- A diner can go from link to confirmed booking in under a minute on a phone, having typed
  nothing but their own details.
- Two people booking the last table at the same instant produce one booking, one clear refusal,
  and a correct seat count. Never two bookings, never a lost seat.
- A diner who closes the tab can still find their booking.
- Every list state and every failure has been designed rather than defaulted.
- The restaurant is never oversold, including if the application code has a bug.

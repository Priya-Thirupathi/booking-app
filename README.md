# Table booking

A small appointment-booking app: find an available sitting, book it in under a minute with no
account, and find that booking again later. See `docs/PRD.md` for the full product write-up
(scope, rules, states, non-goals).

## Stack

Next.js (App Router, TypeScript) + Postgres, via `pg` — chosen so the same code runs against a
local Docker Postgres and against Neon's pooled connection string with nothing but the
`DATABASE_URL` env var changing. UI is Tailwind + shadcn/ui (accessible components copied into
the repo, not a black-box dependency).

## Run it locally (should take under 5 minutes)

```bash
npm install
docker compose up -d          # local Postgres on localhost:5433
cp .env.local.example .env.local   # already points at the docker-compose db
npm run migrate               # applies db/schema.sql
npm run seed                  # seeds a week of sittings (idempotent — no-ops if data exists)
npm run dev                   # http://localhost:3000
```

## Tests

```bash
npm test
```

Runs against the same local Postgres (`docker compose up -d` must be running). The one that
matters most is `tests/concurrency.test.ts`: it fires 20 concurrent bookings of 2 at a freshly
created 10-seat sitting and asserts exactly 5 succeed and `seats_taken` lands on exactly 10 —
the app's core promise, that a sitting can never be oversold under concurrent load.

## How concurrency is handled

A single SQL statement (`lib/booking.ts`, `BOOK_SQL`) does the capacity check and the insert in
one implicit transaction:

```sql
with upd as (
  update sittings set seats_taken = seats_taken + $party_size
  where id = $slot_id and seats_taken + $party_size <= capacity
  returning id
)
insert into bookings (...) select ... from upd returning id, reference_code;
```

Postgres re-evaluates the `where` clause against the row it locks, so the capacity check can't
go stale between read and write — there's no window for two concurrent requests to both see
"8 of 10 taken" and both insert a party of 2. A `CHECK (seats_taken <= capacity)` constraint on
the table means the database itself can never hold an oversold state even if the application
code has a bug.

## Identity without accounts

A booking reference code plus an httpOnly cookie (holding just the booking's id, nothing else)
makes "my bookings" work instantly on the same device. A lookup by reference + email covers
another device — the reference alone isn't a credential, the email has to match too. The
`/api/bookings/[id]/cancel` route re-checks that same email match server-side; the id in the
URL is not, on its own, authorization.

## Cancellation

`lib/canCancel.ts` holds the one live policy: cancellable up to 2 hours before the sitting
(confirmed with the client 4 Sep). If that changes again, it's a one-line edit to
`CANCEL_POLICY` — nothing else in the app needs to know the policy, only whether the function
says yes.

## What's deliberately not here

Payments, a staff/availability screen (sittings are seeded — see `db/seed.ts`), rescheduling,
email/SMS confirmation, waitlists, multi-restaurant support. Each is named with a reason in
`docs/PRD.md`'s Non-goals section rather than silently missing.

## Anti-abuse

Four cheap layers given there's no login: Cloudflare Turnstile (skipped automatically when
`TURNSTILE_SECRET_KEY` isn't set — see `lib/turnstile.ts` — so it works out of the box locally),
a Postgres-backed IP rate limit (`lib/rateLimit.ts`), one email can hold only one *confirmed*
booking per sitting (a partial unique index, so a cancelled booking doesn't block a re-book),
and a party-size cap of 10.

## Known gaps / next steps

- **Deploy**: not yet wired to Vercel/Neon (accounts weren't set up during the build window).
  Swapping `DATABASE_URL` to a Neon connection string and running `vercel deploy` is the whole
  remaining step — nothing in the code assumes local Postgres specifically.
- **Turnstile / rate-limit keys**: real Cloudflare site/secret keys aren't wired in yet; the app
  runs correctly without them (verification is skipped), see `lib/turnstile.ts`.
- **Email confirmation**: no mail provider configured. The reference code is the confirmation;
  emailing it is the natural next feature (needs a provider + verified sending domain).
- `npm audit` reports vulnerabilities in `vitest`'s transitive `esbuild`/`vite` dependency
  (dev-server request-smuggling class of issue). Dev/test tooling only — not part of the
  deployed app — and fixing it needs a vitest major-version bump, left alone under the deadline.

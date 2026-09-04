-- Table booking app schema.
-- Run via `npm run migrate` (scripts/migrate.ts), idempotent (safe to re-run).

create extension if not exists pgcrypto;

create table if not exists sittings (
  id            uuid primary key default gen_random_uuid(),
  date          date not null,
  start_time    time not null,
  timezone      text not null default 'Asia/Kolkata',
  capacity      int not null check (capacity > 0),
  seats_taken   int not null default 0 check (seats_taken >= 0),
  created_at    timestamptz not null default now(),
  constraint seats_within_capacity check (seats_taken <= capacity)
);

create index if not exists sittings_date_idx on sittings (date);

create table if not exists bookings (
  id              uuid primary key default gen_random_uuid(),
  slot_id         uuid not null references sittings(id),
  reference_code  text not null unique,
  name            text not null,
  email           text not null,
  phone           text not null,
  party_size      int not null check (party_size > 0 and party_size <= 10),
  status          text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  ip              text,
  created_at      timestamptz not null default now(),
  cancelled_at    timestamptz
);

create index if not exists bookings_reference_idx on bookings (reference_code);
create index if not exists bookings_slot_idx on bookings (slot_id);

-- Partial (not table-wide) unique index: one email can hold only one *confirmed* booking per
-- slot. A table-wide unique(email, slot_id) would permanently block a re-book after a cancel,
-- since the cancelled row would still occupy the (email, slot_id) pair.
create unique index if not exists bookings_email_slot_confirmed_idx
  on bookings (email, slot_id) where status = 'confirmed';

-- Coarse abuse-rate-limit support: count recent bookings from an IP without a separate table.
create index if not exists bookings_ip_created_idx on bookings (ip, created_at);

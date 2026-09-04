"use client";

import type { BookingView } from "./bookingView";

export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
  ) {
    super(message);
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(body.message ?? "Something went wrong.", body.error ?? "unknown", res.status);
  }
  return body as T;
}

export interface SlotView {
  id: string;
  date: string;
  startTime: string;
  timezone: string;
  capacity: number;
  seatsRemaining: number;
  fitsParty: boolean;
}

export function fetchSlots(date: string, partySize: number) {
  return request<{ slots: SlotView[]; nextAvailableDate?: string | null }>(
    `/api/slots?date=${encodeURIComponent(date)}&partySize=${partySize}`,
  );
}

export interface CreateBookingInput {
  slotId: string;
  name: string;
  email: string;
  phone: string;
  partySize: number;
}

export function createBookingRequest(input: CreateBookingInput) {
  return request<{ id: string; referenceCode: string }>("/api/bookings", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function fetchMyBookings() {
  return request<{ bookings: BookingView[] }>("/api/bookings/mine");
}

export function lookupBookings(referenceCode: string, email: string) {
  return request<{ bookings: BookingView[] }>(
    `/api/bookings/lookup?referenceCode=${encodeURIComponent(referenceCode)}&email=${encodeURIComponent(email)}`,
  );
}

export function cancelBookingRequest(id: string, email: string) {
  return request<{ ok: true }>(`/api/bookings/${id}/cancel`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

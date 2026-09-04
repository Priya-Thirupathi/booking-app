import { z } from "zod";

export const createBookingSchema = z.object({
  slotId: z.string().uuid(),
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().toLowerCase().email().max(320),
  phone: z.string().trim().min(6).max(20),
  partySize: z.number().int().min(1).max(10),
  turnstileToken: z.string().nullable().optional(),
});

export const lookupBookingSchema = z.object({
  referenceCode: z
    .string()
    .trim()
    .toUpperCase()
    .min(4)
    .max(12),
  email: z.string().trim().toLowerCase().email().max(320),
});

export const cancelBookingSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
});

export const slotsQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  partySize: z.coerce.number().int().min(1).max(10).optional(),
});

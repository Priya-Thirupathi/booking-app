import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { pool } from "../lib/db";
import { createBooking, findBookingsByReferenceAndEmail, cancelBooking } from "../lib/booking";

describe("booking lookup and cancel authorization", () => {
  let slotId: string;
  let bookingId: string;
  let referenceCode: string;
  const ownerEmail = "owner@example.com";

  beforeAll(async () => {
    const sitting = await pool.query(
      `insert into sittings (date, start_time, timezone, capacity)
       values (current_date + 31, '19:00', 'Asia/Kolkata', 10)
       returning id`,
    );
    slotId = sitting.rows[0].id;

    const result = await createBooking({
      slotId,
      name: "Owner",
      email: ownerEmail,
      phone: "9999999999",
      partySize: 2,
      ip: "127.0.0.1",
    });
    if (!result.ok) throw new Error("fixture booking failed to create");
    bookingId = result.id;
    referenceCode = result.referenceCode;
  });

  afterAll(async () => {
    await pool.query("delete from bookings where slot_id = $1", [slotId]);
    await pool.query("delete from sittings where id = $1", [slotId]);
    await pool.end();
  });

  it("returns the booking for the correct reference and email", async () => {
    const rows = await findBookingsByReferenceAndEmail(referenceCode, ownerEmail);
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(bookingId);
  });

  it("returns nothing for a correct reference with the wrong email", async () => {
    const rows = await findBookingsByReferenceAndEmail(referenceCode, "someone-else@example.com");
    expect(rows).toHaveLength(0);
  });

  it("returns nothing for a reference that doesn't exist", async () => {
    const rows = await findBookingsByReferenceAndEmail("NOPE1234", ownerEmail);
    expect(rows).toHaveLength(0);
  });

  it("rejects cancel when the email doesn't match, even with a valid booking id", async () => {
    // isAllowed always true here — isolating the authorization check from the cancel policy.
    const result = await cancelBooking(bookingId, "someone-else@example.com", () => true);
    expect(result).toBe("forbidden");
  });

  it("blocks cancel when the policy function says no, even with the correct email", async () => {
    // The real canCancel() default is covered in canCancel.test.ts. This test only guards that
    // cancelBooking() actually honors whatever isAllowed() decides, rather than ignoring it.
    const result = await cancelBooking(bookingId, ownerEmail, () => false);
    expect(result).toBe("policy_blocked");
  });
});

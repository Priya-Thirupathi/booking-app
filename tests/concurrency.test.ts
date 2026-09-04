import { describe, it, expect, afterAll } from "vitest";
import { pool } from "../lib/db";
import { createBooking } from "../lib/booking";
import { createTestSitting, deleteTestSitting } from "./helpers";

// The headline test. 20 concurrent parties of 2 against a 10-seat sitting must produce exactly
// 5 successes and land seats_taken at exactly 10 — never 6 successes (oversold), never a lost
// seat from a failed request that partially applied.
describe("concurrent booking", () => {
  afterAll(async () => {
    await pool.end();
  });

  it("never oversells a sitting under concurrent load", async () => {
    const slotId = await createTestSitting(pool, { capacity: 10, daysAhead: 30 });

    try {
      const attempts = Array.from({ length: 20 }, (_, i) =>
        createBooking({
          slotId,
          name: `Concurrency Test ${i}`,
          email: `concurrency-test-${i}@example.com`,
          phone: "9999999999",
          partySize: 2,
          ip: "127.0.0.1",
        }),
      );

      const results = await Promise.all(attempts);
      const succeeded = results.filter((r) => r.ok);
      const full = results.filter((r) => !r.ok && r.reason === "slot_full");

      expect(succeeded).toHaveLength(5);
      expect(full).toHaveLength(15);

      const referenceCodes = new Set(succeeded.map((r) => (r.ok ? r.referenceCode : "")));
      expect(referenceCodes.size).toBe(5); // every successful booking got a distinct reference

      const finalSlot = await pool.query("select seats_taken, capacity from sittings where id = $1", [
        slotId,
      ]);
      expect(finalSlot.rows[0].seats_taken).toBe(10);
      expect(finalSlot.rows[0].seats_taken).toBeLessThanOrEqual(finalSlot.rows[0].capacity);
    } finally {
      await deleteTestSitting(pool, slotId);
    }
  }, 20000);
});

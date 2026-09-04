import type { Pool } from "pg";

/**
 * Creates an isolated sitting fixture far enough in the future that it can't collide with real
 * seed data or another test file's fixture (each test file should pass its own `daysAhead`).
 * Returns the id; call `deleteTestSitting` in an afterAll/finally to clean it up.
 */
export async function createTestSitting(
  pool: Pool,
  { capacity = 10, daysAhead }: { capacity?: number; daysAhead: number },
): Promise<string> {
  const result = await pool.query(
    `insert into sittings (date, start_time, timezone, capacity)
     values (current_date + $1::int, '19:00', 'Asia/Kolkata', $2)
     returning id`,
    [daysAhead, capacity],
  );
  return result.rows[0].id;
}

export async function deleteTestSitting(pool: Pool, slotId: string): Promise<void> {
  await pool.query("delete from bookings where slot_id = $1", [slotId]);
  await pool.query("delete from sittings where id = $1", [slotId]);
}

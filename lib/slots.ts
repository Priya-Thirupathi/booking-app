import { pool } from "./db";

export interface SlotRow {
  id: string;
  date: string;
  start_time: string;
  timezone: string;
  capacity: number;
  seats_taken: number;
}

export async function findSlotsForDate(date: string): Promise<SlotRow[]> {
  const result = await pool.query(
    `select id, date, start_time, timezone, capacity, seats_taken
     from sittings
     where date = $1
     order by start_time asc`,
    [date],
  );
  return result.rows;
}

export async function findNextAvailableDate(fromDate: string): Promise<string | null> {
  const result = await pool.query(
    `select date from sittings
     where date >= $1 and seats_taken < capacity
     order by date asc
     limit 1`,
    [fromDate],
  );
  return result.rows[0]?.date ?? null;
}

import { config } from "dotenv";
config({ path: ".env.local" });

import { Pool } from "pg";

// Dev/demo data only — there's no staff screen in scope (PRD non-goal), sittings are seeded.
// Not used by the concurrency test, which creates and tears down its own isolated fixture row.

const SITTING_TIMES = ["12:00", "13:30", "19:00", "20:30"];
const TIMEZONE = "Asia/Kolkata";
const DAYS_AHEAD = 7;

function capacityFor(dayOffset: number, time: string): number {
  const isDinner = time === "19:00" || time === "20:30";
  const isWeekend = [0, 6].includes(new Date(Date.now() + dayOffset * 86400000).getDay());
  if (isDinner && isWeekend) return 8; // busiest sittings, smallest pool, easy to see "full"
  return isDinner ? 14 : 20;
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Copy .env.local.example to .env.local first.");
  }
  const pool = new Pool({ connectionString });
  try {
    const existing = await pool.query("select count(*)::int as count from sittings");
    if (existing.rows[0].count > 0) {
      console.log(`sittings already has ${existing.rows[0].count} rows, skipping seed.`);
      return;
    }

    const rows: { date: string; time: string; capacity: number }[] = [];
    for (let d = 0; d < DAYS_AHEAD; d++) {
      const date = new Date(Date.now() + d * 86400000).toISOString().slice(0, 10);
      for (const time of SITTING_TIMES) {
        rows.push({ date, time, capacity: capacityFor(d, time) });
      }
    }

    for (const row of rows) {
      await pool.query(
        `insert into sittings (date, start_time, timezone, capacity) values ($1, $2, $3, $4)`,
        [row.date, row.time, TIMEZONE, row.capacity],
      );
    }
    console.log(`Seeded ${rows.length} sittings across ${DAYS_AHEAD} days.`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

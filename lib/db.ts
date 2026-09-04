import { Pool, types } from "pg";

// pg parses the `date` column type into a JS Date at UTC midnight by default, which then
// prints as the wrong calendar day once formatted in any timezone behind UTC (all of India's
// evening bookings would show as the next day). Sittings are dates, not instants — keep them
// as the 'YYYY-MM-DD' string Postgres sends, same as what's inserted.
types.setTypeParser(types.builtins.DATE, (val) => val);

// One pool for the process. Works unchanged against local Docker Postgres and against Neon's
// pooled connection string later — both speak plain Postgres wire protocol via `pg`, so there's
// nothing to swap but the DATABASE_URL env var at deploy time.
declare global {
  var __bookingDbPool: Pool | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  return new Pool({
    connectionString,
    ssl: connectionString.includes("sslmode=require") ? { rejectUnauthorized: true } : undefined,
  });
}

// Reuse the pool across hot reloads in dev so we don't leak connections.
export const pool = global.__bookingDbPool ?? createPool();
if (process.env.NODE_ENV !== "production") {
  global.__bookingDbPool = pool;
}

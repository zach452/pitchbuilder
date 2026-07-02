/**
 * Database migration script for PostgreSQL (Vercel Postgres).
 * Run with: npm run migrate
 *
 * Requires DATABASE_URL env var to be set.
 * For local dev without DATABASE_URL, SQLite is used automatically — no migration needed.
 */

import { getAdapter } from "../lib/db";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error(
      "DATABASE_URL is not set. This migration targets PostgreSQL.\n" +
      "For local development, SQLite is used automatically — no migration needed."
    );
    process.exit(1);
  }

  console.log("Running PostgreSQL migrations against:", process.env.DATABASE_URL);
  const db = await getAdapter();
  await db.migrate();
  console.log("Migration complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});

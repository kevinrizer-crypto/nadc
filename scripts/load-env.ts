/**
 * Loads .env.local (then .env) into process.env for CLI scripts.
 *
 * Next.js does this automatically for the app, but a `tsx scripts/…` process
 * gets a bare environment — so `npm run news:fetch` failed with "DATABASE_URL
 * is not set" on a machine where the site itself runs fine. Uses Node's
 * built-in loader (>=20.12), so this adds no dependency.
 *
 * Import this FIRST, before anything that reads env at module load — notably
 * `src/db`, which builds its pool from DATABASE_URL on import.
 *
 * Precedence: real environment variables > .env.local > .env. A value exported
 * in the shell always wins, so `DATABASE_URL=… npm run …` still overrides the
 * file for one-off runs against a different database.
 */
const fromShell = { ...process.env };

for (const file of [".env", ".env.local"]) {
  try {
    process.loadEnvFile(file);
  } catch {
    // Absent is normal: CI and Vercel inject variables directly.
  }
}

for (const [key, value] of Object.entries(fromShell)) {
  if (value !== undefined) process.env[key] = value;
}

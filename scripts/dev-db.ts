/**
 * Dev-only embedded Postgres (PGlite) exposed on a local socket so the app,
 * migrations, and seed can run without a Postgres install:
 *
 *   npx tsx scripts/dev-db.ts          # terminal 1 (DATABASE_URL=postgres://127.0.0.1:5544/postgres)
 *   npm run db:migrate && npm run db:seed && npm run dev   # terminal 2
 *
 * Data persists in .pglite/ (gitignored). NOT for production.
 */
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

async function main() {
  const db = await PGlite.create({ dataDir: ".pglite" });
  const server = new PGLiteSocketServer({ db, port: 5544, host: "127.0.0.1" });
  await server.start();
  console.log("PGlite listening on postgres://127.0.0.1:5544/postgres");
  process.on("SIGINT", async () => {
    await server.stop();
    await db.close();
    process.exit(0);
  });
}

main();

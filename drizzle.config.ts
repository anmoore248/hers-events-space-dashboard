import "dotenv/config";
import { defineConfig } from "drizzle-kit";

/**
 * `npm run db:push` creates/updates the tables in the database DATABASE_URL points at.
 * Only the public schema: neon_auth belongs to Neon Auth, which creates and updates it.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  schemaFilter: ["public"],
  dbCredentials: { url: process.env.DATABASE_URL! },
});

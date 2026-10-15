import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env" });

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const [row] = await sql`select now() as time, current_database() as name`;
  console.log(`Connected to "${row.name}" at ${row.time}`);
}

main().catch((err) => {
  console.error("Could not connect:", err.message);
  process.exit(1);
});

/**
 * Checks to see if the database url in .env is connecting
 * Run it with npx tsx ./app/db/check-db.ts. You should see "Connected to" and the time. If not, the connection string in .env.local is wrong or incomplete. 
 * 
 */
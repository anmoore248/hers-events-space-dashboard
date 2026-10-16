import { config } from "dotenv";

config({ path: ".env" });

/**
 * Creates the very first staff account (doc §7). Run once:
 *   npx tsx scripts/seed-staff.ts "Your Name" you@hersnetwork.org "a-long-temporary-password"
 */
async function main() {
  const [name, email, password] = process.argv.slice(2);
  if (!name || !email || !password) {
    throw new Error('Usage: npx tsx scripts/seed-staff.ts "Name" email "password"');
  }
  // Imported after dotenv so DATABASE_URL is set before the database connects.
  const { auth } = await import("../lib/auth");
  const { user } = await auth.api.createUser({
    body: { name, email: email.toLowerCase(), password, role: "staff" },
  });
  console.log(`Created staff account for ${user.email}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

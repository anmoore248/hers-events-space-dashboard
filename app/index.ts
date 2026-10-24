import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";
import { relations } from "./db/relations";


export const db = drizzle(process.env.NEON_DATABASE_URL!, { relations });

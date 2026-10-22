import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { sql } from "drizzle-orm"; 


const db = drizzle(process.env.NEON_DATABASE_URL!);

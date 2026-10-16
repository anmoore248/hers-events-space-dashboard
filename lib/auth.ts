import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { db } from "@/app/db";
import * as schema from "@/app/db/schema";
import { ac, attendee, staff } from "@/lib/permissions";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  user: {
    additionalFields: {
      // Set when staff reset a password (doc §5.4); cleared when the person signs up again.
      passwordCleared: { type: "boolean", defaultValue: false, input: false },
    },
  },
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 10,
  },
  plugins: [
    admin({
      ac,
      roles: { staff, attendee },
      defaultRole: "attendee",
      adminRoles: ["staff"],
    }),
    nextCookies(), // must stay last
  ],
});

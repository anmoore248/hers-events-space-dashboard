import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { ac, attendee, staff } from "@/lib/permissions";

export const authClient = createAuthClient({
  plugins: [adminClient({ ac, roles: { staff, attendee } })],
});

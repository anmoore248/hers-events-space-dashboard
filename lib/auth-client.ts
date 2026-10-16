import { createAuthClient } from "better-auth/client";
import { sentinelClient } from "@better-auth/infra/client";

export const authClient = createAuthClient({
  // ... your existing config
  plugins: [
    // ... other plugins
    sentinelClient({
      identifyUrl: process.env.BETTER_AUTH_IDENTIFY_URL,
    }),
  ],
});

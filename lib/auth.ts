import { betterAuth } from "better-auth";
import { dash, sentinel } from "@better-auth/infra";

export const auth = betterAuth({
  // ... your existing config
  plugins: [
    // ... other plugins
    dash({
      apiKey: process.env.BETTER_AUTH_API_KEY,
    }),
    sentinel(),
  ],
});

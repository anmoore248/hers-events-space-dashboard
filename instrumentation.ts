import * as Sentry from "@sentry/nextjs";

/** Loads Sentry on the server. Without SENTRY_DSN it stays switched off. */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") await import("./sentry.server.config");
}

export const onRequestError = Sentry.captureRequestError;

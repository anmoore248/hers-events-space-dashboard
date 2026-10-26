"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/** Last-resort error page; the error is reported to Sentry (without personal data). */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  return (
    <html lang="en">
      <body style={{ fontFamily: "Montserrat, Arial, sans-serif", padding: "4rem 1rem", textAlign: "center" }}>
        <h1 style={{ color: "#005cb9" }}>Something went wrong</h1>
        <p>Please try again. If it keeps happening, email hers@hersnetwork.org.</p>
        <button onClick={reset} style={{ marginTop: 16, padding: "8px 20px", background: "#005cb9", color: "#fff", border: 0, borderRadius: 6 }}>
          Try again
        </button>
      </body>
    </html>
  );
}

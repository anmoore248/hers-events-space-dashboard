import type { ErrorEvent } from "@sentry/nextjs";

/**
 * Sentry never receives personal data (doc §18): no request bodies (form
 * contents), cookies, headers, query strings, or user details.
 */
export function scrub(event: ErrorEvent): ErrorEvent | null {
  if (event.request) {
    delete event.request.data;
    delete event.request.cookies;
    delete event.request.headers;
    delete event.request.query_string;
  }
  delete event.user;
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.filter((b) => b.category !== "console").map((b) => ({ ...b, data: undefined }));
  }
  const email = /[^\s@]+@[^\s@]+\.[^\s@]+/g;
  if (event.message) event.message = event.message.replace(email, "[email]");
  for (const ex of event.exception?.values ?? []) if (ex.value) ex.value = ex.value.replace(email, "[email]");
  return event;
}

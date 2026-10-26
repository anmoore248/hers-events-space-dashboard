import * as Sentry from "@sentry/nextjs";
import { scrub } from "@/lib/sentry-scrub";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: !!dsn,
  // No personal data (doc §18): no user details, cookies, headers, bodies, query strings or SQL values.
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: false,
    httpBodies: [],
    urlQueryParams: false,
    databaseQueryData: false,
    stackFrameVariables: false,
  },
  tracesSampleRate: 0,
  beforeSend: scrub,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

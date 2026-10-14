# HERS Events — v1 interface

Next.js (App Router, TypeScript) + Tailwind CSS + shadcn/ui + React Hook Form + Zod,
built from the v1 Branded Prototype. UI only: data comes from `lib/mock-data.ts`.

## Run it
    npm install
    npm run dev        # http://localhost:3000 → /login (links to attendee and staff previews)

## Where things are
- `app/(public)`    login, signup, forgot-password, staff-signup/[token]
- `app/(attendee)`  dashboard, add-event, profile, account, events/[eventId]/…
- `app/admin`       staff dashboard, people, staff, activity, settings, account, events/[eventId]/…
- `components/ui`   shadcn-style components (same import paths as `npx shadcn add`)
- `app/globals.css` HERS theme tokens (shadcn variables mapped to HERS colours)
- `lib/schemas.ts`  Zod schemas for forms, server actions and CSV import
- `lib/access.ts`   the single access check (doc §4.1) — wire to Better Auth
- `lib/mock-data.ts` replace with Drizzle queries against Neon

Search the code for `TODO:` to find every place a server action or Better Auth call goes.
Remove the "Preview" links on the login page once auth is wired up.

Account switching test?
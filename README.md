# HERS Events — clean interface (no sample data)

Next.js (App Router, TypeScript) + Tailwind CSS + shadcn/ui + React Hook Form + Zod,
built from the v1 Branded Prototype. There is no mock or sample data anywhere:
every list and page shows an empty state ("There are no events at this time.")
until it is connected to the database.

## Run it

    npm install
    npm run dev        # http://localhost:3000

## How it's put together

Every page reads through **one file** and every button calls **one set of actions**,
so connecting the backend never means editing pages.

| Folder / file | What it is |
| --- | --- |
| `lib/types.ts` | The shapes the screens use (events, sessions, enrollments, …) |
| `lib/data.ts` | Every read. Each function returns an empty result for now |
| `lib/actions/*.ts` | Every write (server actions). Each answers "This isn't connected to the database yet." |
| `lib/access.ts` | The single access check (doc §4.1): full / read-only / none |
| `lib/schemas.ts` | Zod rules shared by the forms and the server |
| `lib/format.ts` | Dates, times, time-zone labels |
| `components/empty-state.tsx` | The "There are no … at this time." box |
| `app/(public)` | login, signup, forgot-password, staff-signup/[token] |
| `app/(attendee)` | dashboard, add-event, profile, account, events/[eventId]/… |
| `app/admin` | staff dashboard, people, staff, activity, settings, account, events/[eventId]/… |

## Connecting the backend

Replace the bodies in `lib/data.ts` with database queries and the bodies in
`lib/actions/*.ts` with real work. The full version of this project (hers-events-full.zip)
does exactly that.
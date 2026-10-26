# HERS Events: the full app

The HERS event platform from the technical documentation, front end and back end in one
Next.js project:

- **Next.js 16** (App Router, TypeScript), Tailwind CSS, shadcn/ui, React Hook Form + Zod
- **Neon** Postgres through **Drizzle ORM 1.0 RC** (`defineRelations`)
- **Neon Auth** (managed Better Auth): email + password, with Neon's admin API for account changes and deactivation
- **Sentry** (optional; sends no personal data)
- Hosted on **Netlify**

There is no sample data. Everything you see comes from your database.

---

## 1. First run on your computer

You need Node 22 or newer and a Neon project with a **dev** branch.

### Set up Neon Auth (once per branch)

Neon Auth is Better Auth run by Neon. It keeps accounts, sessions and hashed passwords in the
branch's `neon_auth` schema, so every branch (dev, main) has its own accounts and its own settings.
Do this for the dev branch now, and again for main before going live:

1. Neon Console → your branch → **Auth** → enable it, and copy the **Auth URL** into `NEON_AUTH_BASE_URL`.
2. **Email + password** on. Email verification can stay off: the platform checks the guest list itself.
3. **Domains:** add every address the app runs at (`https://<your-site>.netlify.app`, deploy
   previews you use). For local work, turn on **Allow localhost** on the dev branch only.
4. **The service account.** The server uses one account, and only that account, for Neon
   Auth's admin API. Create a user (for example `[any-email]@gmail.com` with a long random
   password), then give it the **admin** role (Auth → Users → ⋯ → **Make admin**, or
   `neon neon-auth user set-role <id> --roles admin`). Put its email and password in
   `NEON_AUTH_SERVICE_EMAIL` / `NEON_AUTH_SERVICE_PASSWORD`. Don't give any other account the admin role.
5. **Turn public sign-up off** (Auth → Configuration, or
   `neon neon-auth config email-password update --disable-sign-up`) *after* creating the service
   account. This matters: Neon Auth's own address is public, and with sign-up on anyone could create an
   account without an access key. The platform creates every account itself through the admin API.

### Then

```bash
npm install
cp .env.example .env        # then fill it in (see below)
npm run db:push             # creates the platform's tables in the database DATABASE_URL points at
npm run staff:invite -- you@hersnetwork.org
npm run dev                 # http://localhost:3000
```

`staff:invite` prints a one-time link. Open it, enter your name and a password, and
you're signed in as the first staff member. Every other account is created inside the app.

### `.env`

| Variable | What to put there |
| --- | --- |
| `DATABASE_URL` | Neon → your project → **Connection details**, using your **dev** branch for local work |
| `NEON_AUTH_BASE_URL` | The **Auth URL** of the same branch |
| `NEON_AUTH_COOKIE_SECRET` | At least 32 random characters (`openssl rand -base64 32`). Signs a short-lived session cache cookie |
| `NEON_AUTH_SERVICE_EMAIL`, `NEON_AUTH_SERVICE_PASSWORD` | The branch's service account (step 4 above) |
| `APP_URL` | The address you open the app at, with no trailing slash, for example `http://localhost:3000`. Must be one of Neon Auth's domains |
| `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` | Optional. Leave them empty to switch Sentry off |

> **Tables.** `db:push` only manages the `public` schema (`drizzle.config.ts` sets
> `schemaFilter`). The `neon_auth` schema belongs to Neon Auth: never edit it by hand or with
> Drizzle. If the dev branch has tables from the earlier self-hosted Better Auth version
> (`user`, `session`, `account`, `verification` in `public`), use a fresh Neon branch:
> the user IDs changed from text to uuid, so `db:push` can't convert them in place.

---

## 2. Deploy to Netlify

1. Push the project to GitHub. `.env` is ignored, so it is never committed.
2. In Netlify, choose **Add new site → Import from GitHub** and pick the repository.
   `netlify.toml` already sets the build command and Node 22.
3. In **Site configuration → Environment variables**, add:
   - **Production:** `DATABASE_URL`, `NEON_AUTH_BASE_URL` and the service account from the Neon
     **main** branch, and `APP_URL` set to `https://<your-site>.netlify.app`
   - **Deploy previews:** the same four from the Neon **dev** branch. Leave `APP_URL` unset,
     because each preview has its own address (add the preview addresses you use under Neon Auth → Domains).
   - **All contexts:** `NEON_AUTH_COOKIE_SECRET`, plus the Sentry DSNs if you use Sentry
4. Set up Neon Auth on the main branch (section 1), with **Allow localhost** off.
5. Create the production tables once, from your computer:
   `DATABASE_URL="<main branch URL>" npm run db:push`
6. Create the first production staff account, with the main branch's Neon Auth values in your environment:
   `DATABASE_URL="<main branch URL>" NEON_AUTH_BASE_URL="<main Auth URL>" NEON_AUTH_SERVICE_EMAIL=… NEON_AUTH_SERVICE_PASSWORD=… APP_URL="https://<your-site>.netlify.app" npm run staff:invite -- you@hersnetwork.org`

Choose the site name carefully (for example `hersnetwork-events`) and treat the address as
permanent, since it's in every staff sign-up link and in Neon Auth's trusted domains.

---

## 3. How staff run things (no developer needed)

| Task | Where |
| --- | --- |
| Create an event, get its access key for the Salesforce invitation | **+ New event** → Details tab (copy or regenerate the key) |
| Import the Salesforce guest list | Event → **Attendees → Import CSV** (columns: email, display_name, title, organization, linkedin, subcommittees separated by `;`) |
| Agenda, tracks, speakers, links, subcommittees, announcements | The event's tabs |
| Check-in and attendance export | Event → **Check-in** (add "Month 1…6" points for the WHLI under **Manage points**) |
| Reset an attendee's password | **People** → open the person → **Reset password**. They then use **Sign up** with any of their access keys |
| Change someone's login email, deactivate, or free up a duplicate's address | **People** → open the person |
| Invite staff, clear a staff password (then send a new invite link), deactivate | **Staff** |
| "Message HERS staff" GroupMe link, help email, GroupMe cleanup days | **Settings** |
| Who did what | **Activity log** (also on the dashboard, with a "new" count) |

**Locked out of every staff account?** Run `npm run staff:invite -- <staff email>` against the
production database. It clears that password and prints a new sign-up link.

---

## 4. Where things are

| Path | What it is |
| --- | --- |
| `lib/db/schema.ts` | Every table (doc §16). `user` is a read-only view of Neon Auth's `neon_auth.user`; `members` holds each account's role and password-cleared flag; `sessions_agenda` is the agenda |
| `lib/db/relations.ts` | Drizzle 1.0 `defineRelations` |
| `lib/db/index.ts` | The connection: Neon HTTP driver, or plain Postgres when `DATABASE_DRIVER=pg` or the URL is localhost |
| `lib/auth/index.ts` | Neon Auth for the person making the request (sign in, sign out, change password) |
| `lib/auth/admin.ts`, `admin-client.ts` | Neon Auth's admin API as the service account (create accounts, set passwords, deactivate) |
| `lib/auth/session.ts` | `getCurrentUser()`, `requireUser()`, `requireStaff()` |
| `lib/access.ts` | The single access check: full / read-only / none (doc §4.1) |
| `lib/data.ts` | Every read. Each function checks who is asking |
| `lib/actions/*.ts` | Every write (server actions). Each one validates with Zod, checks permission, and logs to the activity log |
| `lib/schemas.ts` | Zod rules shared by forms and server |
| `lib/import.ts` | CSV import rules, used by the preview and again by the server |
| `lib/time.ts` | Time-zone conversion. Times are stored in UTC and shown in the event's zone |
| `proxy.ts` | Sends signed-out visitors to /login before a private page loads |
| `scripts/staff-invite.ts` | First staff account and lock-out recovery |
| `app/api/auth/[...path]` | Neon Auth's endpoints, proxied. Only `get-session` and `sign-out` are open |

### Useful commands

```bash
npm run dev           # local development
npm run build         # production build (works without .env)
npm run typecheck
npm run db:push       # apply lib/db/schema.ts to the database
npm run db:studio     # browse the database in Drizzle Studio
npm run staff:invite -- name@hersnetwork.org
```

---

## 5. What was tested

> **Neon Auth migration.** The list below was tested on the earlier self-hosted Better Auth
> version. The move to Neon Auth has been typechecked and built, but not yet run against a live
> Neon Auth branch. Before going live, repeat on the dev branch: first staff account, attendee
> sign-up, staff password reset and re-sign-up, email change, deactivate/reactivate, and change password.

The full app was run against Postgres 16 and clicked through in a browser:

- First staff account from the seed link
- Creating an event and filling in links (with scheduled visibility and reordering), tracks,
  speakers, and sessions (time zones, "Save & duplicate", the overlap warning)
- Subcommittees, pinned announcements with unread badges, and a CSV import that flags bad emails,
  duplicates, bad LinkedIn addresses, and unknown subcommittees
- Attendee sign-up: wrong keys refused, keys case-insensitive, short passwords rejected
- Dashboard, event home, agenda, print view, speakers, directory (no emails), and profile
- Check-in, with a second tap doing nothing and a CSV export with one column per point
- Staff-run password reset and re-sign-up
- Expiry, both event-wide and per person, making the event read-only and freezing the profile
- Revoke and restore, email change (with the duplicate-address block), and deactivation
- Staff invites, staff password reset links, the Settings page, and the activity log

A separate security review then checked the auth code. Its fixes have regression tests:

- A staff account can't be claimed through attendee sign-up.
- Deactivating someone cancels their open staff links.
- Better Auth's admin endpoints are closed. (With Neon Auth: only the service account has the admin role, and public sign-up is off in the Neon Console.)
- The attendance export can't carry spreadsheet formulas.
- Rate limits are atomic and count only failed logins.

The one part not exercised here is the Neon HTTP driver itself; the tests used a local
Postgres. Run through sign-up and one import on your Neon dev branch before going live.

---

## 6. Not included (from the roadmap or the doc's handover phase)

- The weekly database backup to Dropbox (doc §20.4)
- Push notifications, an in-platform inbox, speaker self-service and headshots, and the
  merge-accounts tool (version 2)
- Self-service password resets (version 2, when a sending domain is available)

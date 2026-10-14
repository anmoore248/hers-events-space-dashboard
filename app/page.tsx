import { redirect } from "next/navigation";

/**
 * "/" — real version: read the Better Auth session and send
 * attendees to /dashboard, staff to /admin, everyone else to /login.
 */
export default function Home() {
  redirect("/login");
}

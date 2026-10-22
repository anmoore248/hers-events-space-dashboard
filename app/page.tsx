import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/data";

/** "/" sends staff to /admin, attendees to /dashboard, everyone else to /login. */
export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  redirect(user.role === "staff" ? "/admin" : "/dashboard");
}

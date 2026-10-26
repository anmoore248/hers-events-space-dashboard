import "server-only";
import { headers } from "next/headers";

/** The address people use to reach the app: APP_URL, or the address this request came in on (deploy previews). */
export async function appUrl() {
  const base = (process.env.APP_URL ?? "").replace(/\/$/, "");
  if (base) return base;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

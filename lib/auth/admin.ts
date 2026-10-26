import "server-only";
import { appUrl } from "@/lib/app-url";
import { createAuthAdmin, type AuthAdmin } from "./admin-client";

export { AuthAdminError, unusablePassword } from "./admin-client";

let instance: AuthAdmin | undefined;

function create() {
  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  const email = process.env.NEON_AUTH_SERVICE_EMAIL;
  const password = process.env.NEON_AUTH_SERVICE_PASSWORD;
  if (!baseUrl || !email || !password) {
    throw new Error("NEON_AUTH_BASE_URL, NEON_AUTH_SERVICE_EMAIL and NEON_AUTH_SERVICE_PASSWORD must be set.");
  }
  return createAuthAdmin({ baseUrl, email, password, origin: appUrl });
}

/** Neon Auth's admin API as the service account (see admin-client.ts). Server actions only. */
export const authAdmin = new Proxy({} as AuthAdmin, {
  get(_target, prop) {
    instance ??= create();
    return Reflect.get(instance, prop, instance);
  },
});

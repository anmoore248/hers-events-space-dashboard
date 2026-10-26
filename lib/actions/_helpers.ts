import "server-only";
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { getCurrentUser } from "@/lib/auth/session";
import { isUuid } from "@/lib/access";
import type { CurrentUser } from "@/lib/types";

/** Validates action input with the same Zod schema the form used. */
export function parse<S extends z.ZodType>(schema: S, values: unknown): { data: z.output<S> } | { error: string } {
  const r = schema.safeParse(values);
  if (r.success) return { data: r.data };
  return { error: r.error.issues[0]?.message ?? "Please check the form and try again." };
}

/** Every staff action starts here. */
export async function staffOnly(): Promise<CurrentUser | null> {
  const user = await getCurrentUser();
  return user?.role === "staff" ? user : null;
}

export const NOT_STAFF = "Only HERS staff can do that. Try signing in again.";
export const NOT_FOUND = "That item no longer exists. Refresh the page and try again.";

/** Refreshes every page that might show the change, then reports success. */
export function done<T = null>(data: T = null as T): ActionResult<T> {
  revalidatePath("/", "layout");
  return ok(data);
}

export { fail, ok, isUuid };

/** Turns database constraint errors into something staff can act on. */
export function friendly(err: unknown, fallback = "Something went wrong. Please try again."): ActionResult<never> {
  const code = (err as { code?: string; cause?: { code?: string } })?.code ?? (err as { cause?: { code?: string } })?.cause?.code;
  if (code === "23505") return fail("That already exists. Check for a duplicate and try again.");
  console.error(err);
  return fail(fallback);
}

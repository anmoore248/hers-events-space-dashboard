/** What every server action returns, so forms can show the error next to the button. */
export type ActionResult<T = null> = { ok: true; data: T } | { ok: false; error: string };

export const ok = <T = null>(data: T = null as T): ActionResult<T> => ({ ok: true, data });
export const fail = (error: string): ActionResult<never> => ({ ok: false, error });

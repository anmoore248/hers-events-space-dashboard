"use client";

import * as React from "react";
import type { ActionResult } from "@/lib/action-result";

/**
 * Runs a server action, tracks "pending", and keeps the error message so it
 * can be shown next to the control. Returns the result so callers can react
 * to success (close a dialog, reset a form, navigate).
 */
export function useAction() {
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const run = React.useCallback(<T,>(action: () => Promise<ActionResult<T>>) => {
    setError(null);
    return new Promise<ActionResult<T>>((resolve) => {
      startTransition(async () => {
        try {
          const res = await action();
          if (!res.ok) setError(res.error);
          resolve(res);
        } catch {
          const res = { ok: false as const, error: "Something went wrong. Please try again." };
          setError(res.error);
          resolve(res);
        }
      });
    });
  }, []);

  return { run, pending, error, setError };
}

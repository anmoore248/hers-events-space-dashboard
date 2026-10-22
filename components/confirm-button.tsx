"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { FormError } from "@/components/form-error";
import { useAction } from "@/hooks/use-action";
import type { ActionResult } from "@/lib/action-result";

/**
 * A button that asks for confirmation first. Used for every destructive or
 * account-level action. If onConfirm returns a failed result, the dialog stays
 * open and shows the error.
 */
export function ConfirmButton({
  label,
  title,
  description,
  confirmLabel,
  onConfirm,
  variant = "outline",
  size = "sm",
  destructive = false,
  disabled = false,
  children,
}: {
  label: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  confirmLabel: string;
  onConfirm?: () => Promise<ActionResult<unknown>> | void;
  variant?: "default" | "outline" | "destructive";
  size?: "sm" | "default";
  destructive?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const { run, pending, error, setError } = useAction();

  async function confirm() {
    const result = onConfirm?.();
    if (!result) return setOpen(false);
    const res = await run(() => result);
    if (res.ok) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setError(null); }}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} disabled={disabled}>{label}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription asChild><div className="grid gap-2">{description}</div></DialogDescription>}
        </DialogHeader>
        {children}
        <FormError message={error} />
        <DialogFooter>
          <Button variant={destructive ? "destructive" : "default"} disabled={pending} onClick={confirm}>
            {pending ? "Working…" : confirmLabel}
          </Button>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

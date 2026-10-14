"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

/** A button that asks for confirmation first. Used for every destructive or account-level action. */
export function ConfirmButton({
  label,
  title,
  description,
  confirmLabel,
  onConfirm,
  variant = "outline",
  size = "sm",
  destructive = false,
  children,
}: {
  label: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  confirmLabel: string;
  onConfirm?: () => void;
  variant?: "default" | "outline" | "destructive";
  size?: "sm" | "default";
  destructive?: boolean;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size}>{label}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription asChild><div className="grid gap-2">{description}</div></DialogDescription>}
        </DialogHeader>
        {children}
        <DialogFooter>
          <Button
            variant={destructive ? "destructive" : "default"}
            onClick={() => {
              onConfirm?.();
              setOpen(false);
            }}
          >
            {confirmLabel}
          </Button>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

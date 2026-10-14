"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReorderButtons({ label, index, count, onMove }: { label: string; index: number; count: number; onMove: (from: number, to: number) => void }) {
  return (
    <div className="flex gap-1">
      <Button variant="outline" size="icon" aria-label={`Move ${label} up`} disabled={index === 0} onClick={() => onMove(index, index - 1)}>
        <ArrowUp />
      </Button>
      <Button variant="outline" size="icon" aria-label={`Move ${label} down`} disabled={index === count - 1} onClick={() => onMove(index, index + 1)}>
        <ArrowDown />
      </Button>
    </div>
  );
}

export function move<T>(list: T[], from: number, to: number) {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

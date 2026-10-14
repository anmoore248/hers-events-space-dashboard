"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

/** Heading + count + client-side search box. Fine for HERS-sized lists (≤ ~200). */
export function SearchableList<T>({
  title,
  items,
  searchText,
  placeholder,
  renderItem,
  getKey,
  emptyText = "No matches. Try a different search.",
}: {
  title: string;
  items: T[];
  searchText: (item: T) => string;
  placeholder: string;
  renderItem: (item: T) => React.ReactNode;
  getKey: (item: T) => string;
  emptyText?: string;
}) {
  const [q, setQ] = React.useState("");
  const query = q.trim().toLowerCase();
  const filtered = query ? items.filter((i) => searchText(i).toLowerCase().includes(query)) : items;
  const id = React.useId();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-bold text-primary">
          {title} ({items.length})
        </h2>
        <div className="relative w-full sm:w-72">
          <label htmlFor={id} className="sr-only">{placeholder}</label>
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input id={id} type="search" placeholder={placeholder} value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
      </div>
      {filtered.length ? (
        <ul className="overflow-hidden rounded-lg border bg-card">
          {filtered.map((item) => (
            <li key={getKey(item)} className="border-b last:border-b-0">{renderItem(item)}</li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">{emptyText}</p>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/** Underlined section tabs. The first tab (the base path) is only active on an exact match. */
export function TabNav({
  base,
  tabs,
}: {
  base: string;
  tabs: { href: string; label: string }[];
}) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Sections"
      className="-mb-px flex gap-1 overflow-x-auto print:hidden"
    >
      {tabs.map((tab) => {
        const href = tab.href ? `${base}/${tab.href}` : base;
        const active = tab.href
          ? pathname === href || pathname.startsWith(href + "/")
          : pathname === base;
        return (
          <Link
            key={tab.label}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "border-b-2 px-3 py-2.5 text-[13px] font-semibold whitespace-nowrap no-underline",
              active
                ? "border-primary text-primary"
                : "text-foreground hover:text-primary border-transparent",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

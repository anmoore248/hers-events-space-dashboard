"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type NavItem = { href: string; label: string; match?: string[] };

export function TopNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="flex items-center gap-1 overflow-x-auto">
      {items.map((item) => {
        const prefixes = item.match ?? [item.href];
        const active = prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "whitespace-nowrap border-b-2 px-3 py-2 text-[13px] font-semibold no-underline",
              active ? "border-primary text-primary" : "border-transparent text-foreground hover:text-primary",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

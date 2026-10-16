"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type NavItem = { href: string; label: string; match?: string[] };

export function TopNav({
  items,
  user_name,
}: {
  items: NavItem[];
  user_name: string;
}) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="flex items-center gap-1 overflow-x-auto">
      <p className="text-primary text-[13px] font-semibold">
        {user_name ? user_name : "empty"}
      </p>
      {items.map((item) => {
        const prefixes = item.match ?? [item.href];
        const active = prefixes.some(
          (p) => pathname === p || pathname.startsWith(p + "/"),
        );
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "border-b-2 px-3 py-2 text-[13px] font-semibold whitespace-nowrap no-underline",
              active
                ? "border-primary text-primary"
                : "text-foreground hover:text-primary border-transparent",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

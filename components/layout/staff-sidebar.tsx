"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Dashboard", exact: true, alsoActive: "/admin/events/" },
  { href: "/admin/events/new", label: "+ New event", exact: true },
  { href: "/admin/people", label: "People" },
  { href: "/admin/staff", label: "Staff" },
  { href: "/admin/activity", label: "Activity log" },
  { href: "/admin/settings", label: "Settings" },
];

export function StaffSidebar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Staff"
      className="flex gap-1 overflow-x-auto border-b bg-white p-2 md:min-h-[calc(100vh-67px)] md:w-48 md:shrink-0 md:flex-col md:border-b-0 md:border-r md:p-3 print:hidden"
    >
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href ||
            (!!item.alsoActive && pathname.startsWith(item.alsoActive) && pathname !== "/admin/events/new")
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "whitespace-nowrap rounded-md px-3 py-2.5 text-[13px] font-semibold no-underline",
              active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary hover:text-primary",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

import Image from "next/image";
import Link from "next/link";
import { TopNav, type NavItem } from "./top-nav";

export function SiteHeader({
  staff = false,
  nav = [],
  homeHref = "/",
  user_name = "",
}: {
  staff?: boolean;
  nav?: NavItem[];
  homeHref?: string;
  user_name: string;
}) {
  return (
    <header className="border-primary border-b-[3px] bg-white print:hidden">
      <div className="flex min-h-16 flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2 sm:px-6">
        <Link href={homeHref} className="flex items-center gap-4 no-underline">
          <Image
            src="/hers-logo.png"
            alt="HERS"
            width={2805}
            height={364}
            priority
            className="h-7 w-auto"
          />
          <span className="text-primary border-l pl-4 text-sm font-bold">
            HERS Events{staff && " · Staff"}
          </span>
        </Link>
        {nav.length > 0 && <TopNav items={nav} user_name={user_name} />}
      </div>
    </header>
  );
}

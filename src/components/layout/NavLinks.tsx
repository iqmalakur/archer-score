"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItem } from "@/data/nav-item";

export const NavLinks = () => {
  const pathname = usePathname();

  return (
    <>
      {navItem.map((item) => {
        const isCurrentPage = pathname === item.url;
        const current = isCurrentPage ? "page" : "location";
        const isActive =
          isCurrentPage ||
          (item.url !== "/" && pathname.startsWith(`${item.url}/`));

        return (
          <Link
            key={item.url}
            href={item.url}
            aria-current={isActive ? current : undefined}
            className={`flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl p-1
              text-xs whitespace-nowrap transition-colors focus-visible:outline-2
              focus-visible:outline-offset-2 focus-visible:outline-primary
              md:flex-row md:gap-2 md:px-3 md:text-sm ${
              isActive
                ? "font-semibold text-primary-dark md:bg-primary-soft"
                : "font-medium text-ink-muted hover:bg-surface-muted hover:text-ink"
            }`}
          >
            <span
              className={`flex h-7 w-14 items-center justify-center rounded-full md:size-auto ${
                isActive ? "bg-primary-soft" : ""
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-5"
                aria-hidden="true"
              >
                <path d={item.iconPath} />
              </svg>
            </span>
            {item.label}
          </Link>
        );
      })}
    </>
  );
};

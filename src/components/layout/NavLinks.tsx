import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItem } from "@/data/nav-item";

export interface NavLinksProps {
  onNavigate?: () => void;
}

export const NavLinks = ({ onNavigate }: NavLinksProps) => {
  const pathname = usePathname();

  return (
    <>
      {navItem.map((item) => {
        const isActive = pathname === item.url;

        return (
          <Link
            key={item.url}
            href={item.url}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
              isActive
                ? "bg-primary text-white shadow-sm"
                : "text-ink-muted hover:bg-surface-muted hover:text-ink"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
};

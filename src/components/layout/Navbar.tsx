import { NavLinks } from "./NavLinks";

export const Navbar = () => (
  <nav
    aria-label="Navigasi utama"
    className="app-navigation fixed inset-x-0 bottom-0 grid h-[calc(var(--tab-bar-height)+env(safe-area-inset-bottom))]
      grid-cols-3 gap-1 border-t border-line bg-surface pt-1.5
      pr-[calc(0.75rem+env(safe-area-inset-right))] pb-[calc(0.375rem+env(safe-area-inset-bottom))]
      pl-[calc(0.75rem+env(safe-area-inset-left))] shadow-[0_-6px_30px_rgb(23_45_32/0.06)]
      md:static md:flex md:h-auto md:items-center md:border-0 md:bg-transparent md:p-0 md:shadow-none"
  >
    <NavLinks />
  </nav>
);

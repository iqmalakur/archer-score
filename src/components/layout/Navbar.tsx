"use client";

import { useState } from "react";
import { NavLinks } from "./NavLinks";

export const Navbar = () => {
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  return (
    <nav
      aria-label="Navigasi utama"
      className="relative flex min-w-0 items-center justify-end gap-2 sm:gap-3"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Buka menu navigasi"
        aria-expanded={open}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface text-ink shadow-sm transition-transform duration-150 hover:scale-105 active:scale-95 sm:hidden"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="currentColor"
          className="h-5 w-5"
          aria-hidden
        >
          {open ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          )}
        </svg>
      </button>

      <div className="hidden flex-wrap items-center gap-1 rounded-full border border-line bg-surface p-1 shadow-sm sm:flex">
        <NavLinks />
      </div>

      {open && (
        <div className="animate-[scaleIn_0.15s_ease-out_both] absolute right-2 top-16 z-50 flex flex-col gap-1 rounded-2xl border border-line bg-surface p-2 shadow-xl sm:hidden">
          <NavLinks onNavigate={close} />
        </div>
      )}
    </nav>
  );
};

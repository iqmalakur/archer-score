"use client";

import type { SVGProps } from "react";
import { useEffect } from "react";

const Sun = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.8}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
    />
  </svg>
);

const Moon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.8}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
    />
  </svg>
);

export const ThemeToggle = () => {
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem("theme");
    } catch {
      // Theme changes still work when browser storage is unavailable.
    }
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const dark = stored ? stored === "dark" : prefersDark;
    document.documentElement.setAttribute(
      "data-theme",
      dark ? "dark" : "light",
    );
  }, []);

  const toggle = () => {
    const html = document.documentElement;
    const isDark = html.getAttribute("data-theme") === "dark";
    html.setAttribute("data-theme", isDark ? "light" : "dark");
    try {
      localStorage.setItem("theme", isDark ? "light" : "dark");
    } catch {
      // Keep the selected theme for this page even if it cannot be persisted.
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Ganti tema terang/gelap"
      className="relative flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl
        border border-line bg-surface text-ink transition-colors hover:bg-surface-muted
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <Sun aria-hidden="true" className="size-5 dark:hidden" />
      <Moon aria-hidden="true" className="hidden size-5 dark:block" />
    </button>
  );
};

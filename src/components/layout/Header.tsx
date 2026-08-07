"use client";

import { ThemeToggle } from "../ThemeToggle";
import { Navbar } from "./Navbar";

export const Header = () => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-line bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-8">
        <h1 className="flex shrink-0 items-center gap-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
          ArcherScore
        </h1>
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Navbar />
        </div>
      </div>
    </header>
  );
};

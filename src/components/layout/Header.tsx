import Image from "next/image";
import { ThemeToggle } from "../ThemeToggle";
import { Navbar } from "./Navbar";
import { ScoringNavigationLink } from "./ScoringNavigation";

export const Header = () => {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-background pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-15 max-w-5xl items-center gap-4 px-4 sm:px-8">
        <ScoringNavigationLink
          href="/"
          className="mr-auto flex min-h-11 shrink-0 items-center gap-2 rounded-lg text-xl font-bold
            tracking-tight text-ink focus-visible:outline-2 focus-visible:outline-offset-2
            focus-visible:outline-primary"
        >
          <Image
            src="/brand/panara-mark.svg"
            alt=""
            width={36}
            height={36}
            loading="eager"
            className="rounded-xl bg-primary-soft"
            unoptimized
          />
          Panara
        </ScoringNavigationLink>
        <Navbar />
        <ThemeToggle />
      </div>
    </header>
  );
};

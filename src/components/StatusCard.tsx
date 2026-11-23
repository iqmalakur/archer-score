import type { ReactNode } from "react";

interface StatusCardProps {
  title: string;
  description: string;
  inset?: boolean;
  children?: ReactNode;
}

export const StatusCard = ({
  title,
  description,
  inset = false,
  children,
}: StatusCardProps) => {
  const Heading = inset ? "h2" : "h1";
  const card = (
    <section
      className="flex w-full flex-col items-center gap-4 rounded-2xl border border-line
        bg-surface px-5 py-10 text-center sm:px-10 sm:py-14"
    >
      <span
        aria-hidden="true"
        className="grid size-13 place-items-center rounded-full border border-primary/25 bg-primary-soft"
      >
        <span className="grid size-8 place-items-center rounded-full border border-primary/50">
          <span className="size-3 rounded-full bg-primary" />
        </span>
      </span>
      <div className="space-y-2">
        <Heading className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
          {title}
        </Heading>
        <p className="max-w-md text-sm leading-relaxed text-ink-muted">
          {description}
        </p>
      </div>
      {children}
    </section>
  );

  if (inset) return card;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-8 sm:py-10">
      {card}
    </main>
  );
};

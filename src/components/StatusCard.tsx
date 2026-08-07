import type { ReactNode } from "react";

interface StatusCardProps {
  icon: string;
  title: string;
  description: string;
  children?: ReactNode;
}

export const StatusCard = ({
  icon,
  title,
  description,
  children,
}: StatusCardProps) => {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6 p-4 pb-14 sm:p-8">
      <section className="animate-[fadeInUp_0.5s_ease-out_both] flex w-full flex-col items-center gap-4 rounded-2xl border border-white/20 bg-surface/75 px-6 py-10 text-center shadow-xl backdrop-blur-xl sm:px-12 sm:py-14">
        <span
          aria-hidden
          className="flex h-16 w-16 items-center justify-center rounded-full border border-line bg-surface-muted text-3xl"
        >
          {icon}
        </span>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
          {title}
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-ink-muted sm:text-base">
          {description}
        </p>
        {children}
      </section>
    </main>
  );
};

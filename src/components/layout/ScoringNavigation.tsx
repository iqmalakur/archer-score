"use client";

import Link from "next/link";
import { createContext, useContext, useEffectEvent, useLayoutEffect, useRef } from "react";
import type { ComponentProps, ReactNode, RefObject } from "react";

type LeaveScoring = (href: string) => void;
const ScoringNavigation = createContext<RefObject<LeaveScoring | null> | null>(null);

export function ScoringNavigationProvider({ children }: { children: ReactNode }) {
  const guardRef = useRef<LeaveScoring>(null);
  return <ScoringNavigation value={guardRef}>{children}</ScoringNavigation>;
}

export function useScoringNavigationGuard(active: boolean, onLeave: LeaveScoring) {
  const guardRef = useContext(ScoringNavigation);
  const requestLeave = useEffectEvent(onLeave);

  useLayoutEffect(() => {
    if (!active || !guardRef) return;

    guardRef.current = (href) => requestLeave(href);
    return () => { guardRef.current = null; };
  }, [active, guardRef]);
}

type ScoringLinkProps = Omit<ComponentProps<typeof Link>, "href" | "onNavigate"> & { href: string };

export function ScoringNavigationLink(props: ScoringLinkProps) {
  const guardRef = useContext(ScoringNavigation);

  return (
    <Link
      {...props}
      onNavigate={(event) => {
        if (!guardRef?.current) return;

        event.preventDefault();
        guardRef.current(props.href);
      }}
    />
  );
}

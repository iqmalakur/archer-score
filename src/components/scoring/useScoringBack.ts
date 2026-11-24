"use client";

import { useEffect, useEffectEvent } from "react";

type ScoringEntry = { sessionId: string; active: boolean };

function pushScoringEntry(sessionId: string) {
  window.history.pushState({ scoringBack: { sessionId, active: true } }, "");
}

export function useScoringBack(
  loaded: boolean,
  sessionId: string | undefined,
  restorableId: string | undefined,
  onBack: () => boolean,
) {
  const handlePopState = useEffectEvent((event: PopStateEvent) => {
    const entry: ScoringEntry | undefined = event.state?.scoringBack;
    if (!entry || window.location.pathname !== "/") return;

    if (entry.active) {
      if (loaded && !sessionId && entry.sessionId !== restorableId) window.history.back();
      return;
    }

    if (entry.sessionId === sessionId && onBack()) pushScoringEntry(sessionId);
  });

  useEffect(() => {
    const onPopState = (event: PopStateEvent) => handlePopState(event);

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const entry: ScoringEntry | undefined = window.history.state?.scoringBack;

    if (sessionId) {
      if (entry?.active && entry.sessionId === sessionId) return;
      // Keep a setup entry beneath the active scoring flow.
      window.history.replaceState({ scoringBack: { sessionId, active: false } }, "");
      pushScoringEntry(sessionId);
      return;
    }

    if (entry?.active && entry.sessionId !== restorableId) window.history.back();
  }, [loaded, restorableId, sessionId]);
}

import type { EndSessionType } from "../types/end-session";
import type { SetupType } from "../types/setup";

export async function getSessionId(
  session: EndSessionType,
  setup: SetupType,
): Promise<string> {
  if (session.sessionId) return session.sessionId;

  // Legacy drafts need a stable identity even when localStorage writes fail.
  const data = new TextEncoder().encode(JSON.stringify([setup, session]));
  const digest = await crypto.subtle.digest("SHA-256", data);
  const hash = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");

  return `legacy-${hash}`;
}

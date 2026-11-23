import type { SetupDraft, TargetSession } from "../types/target-session";
import { db } from "./db";
import { getSessionId } from "./practice-session";
import { getSessionSetup, isValidSession, isValidSetup } from "./practice-validation";
import { createTarget, readTargetSettings } from "./target-settings";
import { isValidSetupDraft, isValidTargetSession, restoreTargetSession } from "./target-session";

export const DEFAULT_SETUP: SetupDraft = {
  schemaVersion: 2, title: "", distance: 8, endCount: 4, arrowCount: 5,
};
export const STORAGE_WARNING = "Gagal menyimpan draft di browser. Skor tetap ada di halaman ini, "
  + "tetapi perubahan dapat hilang saat dimuat ulang. Coba simpan draft lagi.";

export async function loadScoringState() {
  const state = {
    setup: DEFAULT_SETUP, target: createTarget(), message: "", blocked: false,
    settingsError: false, restoreFailed: false, completed: false,
    session: null as TargetSession | null, converted: false,
  };
  let savedSetup: string | null;
  let savedDraft: string | null;
  try {
    savedSetup = localStorage.getItem("setup");
    savedDraft = localStorage.getItem("endSession");
  } catch {
    return { ...state, message: STORAGE_WARNING };
  }

  let preferences: unknown;
  try {
    preferences = savedSetup === null ? null : JSON.parse(savedSetup);
    if (isValidSetupDraft(preferences)) state.setup = preferences;
    else if (isValidSetup(preferences)) state.setup = {
      ...DEFAULT_SETUP, endCount: preferences.endCount, arrowCount: preferences.arrowCount,
    };
    else if (savedSetup !== null) state.message = "Setup tersimpan tidak valid. Silakan atur ulang latihan.";
  } catch {
    state.message = "Setup tersimpan tidak valid. Silakan atur ulang latihan.";
  }

  try { state.target = readTargetSettings(localStorage); }
  catch {
    state.settingsError = true;
    state.message = "Target tersimpan tidak dapat dibaca. "
      + "Periksa dan simpan target melalui Pengaturan sebelum membuat sesi baru.";
  }
  if (savedDraft === null) return state;
  state.blocked = true;

  let parsed: unknown;
  let id: string;
  try {
    parsed = JSON.parse(savedDraft);
    if (isValidTargetSession(parsed)) id = parsed.sessionId;
    else {
      const setup = getSessionSetup(parsed, preferences);
      if (!setup || !isValidSession(parsed, setup)
        || (typeof parsed === "object" && parsed !== null && "schemaVersion" in parsed)) {
        throw new Error("Invalid draft");
      }
      id = await getSessionId(parsed, setup);
    }
  } catch {
    state.message = "Draft tidak valid atau tidak cocok dengan setup. "
      + "Draft tetap disimpan sampai Anda memilih buat sesi baru.";
    return state;
  }

  try {
    if (await db.getCompletedSession(id)) {
      state.completed = true;
      state.blocked = false;
      state.message = "Sesi ini sudah selesai. Draft lama tidak akan dilanjutkan.";
      return state;
    }
    const restored = await restoreTargetSession(parsed, preferences);
    state.session = restored.session;
    state.converted = restored.converted;
    state.message = "Sesi skoring tersimpan tersedia. Pilih lanjutkan atau buat sesi baru.";
  } catch {
    state.restoreFailed = true;
    state.message = "Gagal memeriksa status draft. Draft tetap disimpan. Silakan periksa ulang.";
  }
  return state;
}

export function saveScoringDraft(session: TargetSession) {
  if (!isValidTargetSession(session)) throw new Error("Invalid session update");
  localStorage.setItem("endSession", JSON.stringify(session));
}

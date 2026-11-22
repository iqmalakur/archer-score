"use client";

import { useEffect, useRef, useState } from "react";
import type { AlertProps } from "@/components/Alert";
import type { ArrowEntry, SetupDraft, TargetSession } from "@/types/target-session";
import { db, type Practice } from "@/lib/db";
import { createTarget, prepareTargetSettings, readTargetSettings } from "@/lib/target-settings";
import { completeEnd, emptyEnds, isValidSetupDraft, scoreProjection } from "@/lib/target-session";
import { DEFAULT_SETUP, loadScoringState, saveScoringDraft, STORAGE_WARNING } from "@/lib/scoring-storage";

type Dialog = Omit<AlertProps, "show"> | null;

function useScoringDialog() {
  const [dialog, setDialog] = useState<Dialog>(null);
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const confirm = async () => {
    if (busy.current) return;
    setPending(true);
    try {
      busy.current = true;
      await dialog?.onConfirm?.();
      setDialog(null);
    } catch {
      setDialog((previous) => ({
        ...previous, type: "danger", title: previous?.title ?? "Gagal menyimpan latihan",
        message: "Gagal menyimpan latihan. Skor tetap tersedia di halaman ini. Silakan coba lagi.",
        confirmText: "Coba lagi",
      }));
    } finally { busy.current = false; setPending(false); }
  };
  return { dialog, setDialog, pending, confirm,
    closeDialog: () => { if (!busy.current) setDialog(null); } };
}

export function useScoringSession() {
  const [initial, setInitial] = useState<Awaited<ReturnType<typeof loadScoringState>> | null>(null);
  const [setup, setSetup] = useState(DEFAULT_SETUP);
  const [target, setTarget] = useState(createTarget);
  const [session, setSession] = useState<TargetSession | null>(null);
  const [result, setResult] = useState<Practice | null>(null);
  const [message, setMessage] = useState("");
  const dialogs = useScoringDialog();
  const { setDialog } = dialogs;
  const [cleanupFailed, setCleanupFailed] = useState(false);
  const latest = useRef<TargetSession | null>(null);
  const completed = useRef(false);

  const clearDraft = () => {
    try { localStorage.removeItem("endSession"); setCleanupFailed(false); }
    catch { setCleanupFailed(true); }
  };
  const discard = () => {
    try { localStorage.removeItem("endSession"); setMessage(""); }
    catch { setMessage(STORAGE_WARNING); }
    setInitial((previous) => previous ? { ...previous, blocked: false, session: null } : previous);
  };
  const commit = (next: TargetSession) => {
    if (completed.current) return false;
    latest.current = next;
    setSession(next);
    try { saveScoringDraft(next); setMessage(""); return true; }
    catch { setMessage(STORAGE_WARNING); return false; }
  };
  const resume = (restored: TargetSession, converted: boolean) => {
    const saved = commit(restored);
    setSetup({
      schemaVersion: 2, title: restored.title, distance: restored.distance,
      endCount: restored.endCount, arrowCount: restored.arrowCount,
    });
    setInitial((previous) => previous ? { ...previous, blocked: false } : previous);
    if (converted) setMessage((saved ? "" : STORAGE_WARNING + " ") + "Draft lama dipulihkan tanpa posisi buatan. "
      + "Periksa slot nol yang sekarang belum diisi, termasuk rambahan sebelumnya.");
  };

  useEffect(() => {
    let cancelled = false;
    loadScoringState().then((loaded) => {
      if (cancelled) return;
      setInitial(loaded);
      setSetup(loaded.setup);
      setTarget(loaded.target);
      setMessage(loaded.message);
      if (loaded.completed) clearDraft();
      if (loaded.session) setDialog({
        type: "info", title: "Lanjutkan skoring?",
        message: "Sesi skoring akan dilanjutkan dari rambahan terakhir.",
        confirmText: "Lanjutkan", cancelText: "Buat ulang sesi",
        onConfirm: () => resume(loaded.session!, loaded.converted), onCancel: discard,
      });
    });
    return () => { cancelled = true; };
    // Initial restoration runs once; later actions use explicit state updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const editSetup = (next: SetupDraft) => {
    setSetup(next);
    try { localStorage.setItem("setup", JSON.stringify(next)); }
    catch { setMessage(STORAGE_WARNING); }
  };
  const start = () => {
    if (!isValidSetupDraft(setup) || initial?.blocked || initial?.settingsError) return;
    let settings;
    try { settings = prepareTargetSettings(localStorage, target); }
    catch (error) {
      if (error instanceof DOMException) settings = { target, saved: false };
      else { setMessage("Target tersimpan tidak valid. Periksa dan simpan ulang melalui Setting."); return; }
    }
    completed.current = false;
    setResult(null);
    setCleanupFailed(false);
    setTarget(settings.target);
    commit({
      ...setup, sessionId: crypto.randomUUID(), currentEnd: 1, isStarted: true,
      targetSnapshot: structuredClone(settings.target), ends: emptyEnds(setup),
    });
    if (!settings.saved) setMessage((previous) => previous
      + " Setting target tidak tersedia; sesi ini memakai konfigurasi terakhir yang ditampilkan.");
  };
  const updateEnd = (entries: ArrowEntry[]) => {
    const current = latest.current;
    if (!current) return;
    commit({ ...current, ends: current.ends.map((end, index) =>
      index === current.currentEnd - 1 ? entries : end) });
  };
  const finish = async () => {
    const current = latest.current;
    if (!current || completed.current || !current.ends.every(completeEnd)) return;
    const practice = await db.addPractice({
      ...scoreProjection(current), schemaVersion: 2, targetSnapshot: current.targetSnapshot,
      ends: current.ends, title: current.title, distance: current.distance,
      sessionId: current.sessionId, createdAt: new Date(),
    });
    completed.current = true;
    clearDraft();
    setMessage("");
    setResult(practice);
  };
  return {
    ...dialogs, initial, setup, target, session, result, message, cleanupFailed,
    editSetup, start, commit, updateEnd, finish, clearDraft, discard,
    retrySave: () => { if (latest.current) commit(latest.current); },
    resumeStored: () => { if (initial?.session) resume(initial.session, initial.converted); },
    restart: () => {
      latest.current = null;
      setSession(null);
      setResult(null);
      try { setTarget(readTargetSettings(localStorage)); }
      catch { setMessage("Target tidak dapat dibaca. Periksa dan simpan ulang melalui Setting."); }
    },
  };
}

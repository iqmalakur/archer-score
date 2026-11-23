"use client";

import { useEffect, useRef, useState } from "react";
import { Alert } from "@/components/Alert";
import { LoadingScreen } from "@/components/LoadingScreen";
import { PracticeEnds, PracticeResult } from "@/components/PracticeDetails";
import { completeEnd } from "@/lib/target-session";
import { Setup } from "./Setup";
import { End } from "./End";
import { useScoringSession } from "./useScoringSession";

type Scoring = ReturnType<typeof useScoringSession>;

function SessionScreen({ scoring }: { scoring: Scoring }) {
  const { session, commit, updateEnd, setDialog } = scoring;
  const [aiming, setAiming] = useState(false);
  if (!session) return null;
  const entries = session.ends[session.currentEnd - 1];
  const currentComplete = completeEnd(entries);
  const completed = session.ends.filter(completeEnd).length;
  const allComplete = completed === session.endCount;
  const isLast = session.currentEnd === session.endCount;

  return (
    <section className="scoring-session">
      <header className="session-heading">
        <p>Latihan · {session.distance} m</p>
        <h1>Rambahan {session.currentEnd} dari {session.endCount}</h1>
        <progress
          aria-label="Rambahan lengkap"
          value={completed}
          max={session.endCount}
        />
      </header>
      <fieldset disabled={scoring.pending}>
        <End
          key={session.currentEnd}
          entries={entries} target={session.targetSnapshot}
          disabled={scoring.pending || Boolean(scoring.dialog)}
          onChange={updateEnd} onBusyChange={setAiming}
          onReset={(afterReset) => setDialog({
            title: "Reset rambahan ini?", type: "warning",
            message: "Semua panah dan Miss di rambahan ini akan dikembalikan ke bawah. Rambahan lain tetap tersimpan.",
            confirmText: "Reset rambahan", cancelText: "Batal",
            onConfirm: () => {
              updateEnd(entries.map(({ id }) => ({ id, status: "empty" })));
              afterReset();
            },
          })}
        />
        {isLast && currentComplete && !allComplete && (
          <p className="scoring-help">
            Lengkapi rambahan sebelumnya untuk menyimpan latihan.
          </p>
        )}
        <div className="scoring-actions scoring-navigation">
          <button
            type="button" disabled={aiming}
            onClick={() => session.currentEnd > 1
              ? commit({ ...session, currentEnd: session.currentEnd - 1 })
              : setDialog({
                title: "Batalkan latihan?", type: "danger",
                message: "Semua skor pada sesi latihan ini akan dihapus.",
                confirmText: "Ya, batalkan", cancelText: "Batal",
                onConfirm: () => { scoring.discard(); scoring.restart(); },
              })}
          >{session.currentEnd > 1 ? "Kembali" : "Batalkan latihan"}</button>
          <button
            type="button" className="scoring-primary"
            disabled={aiming || !currentComplete || (isLast && !allComplete)}
            onClick={() => !isLast
              ? commit({ ...session, currentEnd: session.currentEnd + 1 })
              : setDialog({
                title: "Selesaikan skoring?", type: "success",
                message: "Hasil akhir akan dihitung dan disimpan berdasarkan semua panah yang sudah dicatat.",
                confirmText: "Selesai", cancelText: "Batal", onConfirm: scoring.finish,
              })}
          >{isLast ? "Selesai" : "Lanjut"}</button>
        </div>
      </fieldset>
    </section>
  );
}

function StorageMessages({ scoring }: { scoring: Scoring }) {
  return (
    <>
      {scoring.message && (
        <div role="alert" className="scoring-notice">
          {scoring.message}
          {scoring.initial?.restoreFailed && (
            <button type="button" onClick={() => window.location.reload()}>Periksa ulang draft</button>
          )}
          {scoring.initial?.blocked && (
            <div className="scoring-actions">
              {scoring.initial.session && (
                <button type="button" onClick={() => scoring.setDialog({
                  title: "Lanjutkan skoring?", type: "info",
                  message: "Sesi skoring akan dilanjutkan dari rambahan terakhir.",
                  confirmText: "Lanjutkan", cancelText: "Buat ulang sesi",
                  onConfirm: scoring.resumeStored,
                  onCancel: scoring.discard,
                })}>Lanjutkan sesi tersimpan</button>
              )}
              <button type="button" onClick={scoring.discard}>Buat sesi baru dan buang draft</button>
            </div>
          )}
          {scoring.session && !scoring.result && (
            <button type="button" onClick={scoring.retrySave}>Coba simpan draft lagi</button>
          )}
        </div>
      )}
      {scoring.cleanupFailed && (
        <div role="alert" className="scoring-notice">
          Sesi sudah selesai, tetapi draft belum dapat dihapus.
          <button type="button" onClick={scoring.clearDraft}>Coba hapus draft lagi</button>
        </div>
      )}
    </>
  );
}

export function Main() {
  const scoring = useScoringSession();
  const { result, dialog } = scoring;
  const main = useRef<HTMLElement>(null);

  useEffect(() => {
    if (result && !dialog) {
      main.current?.focus({ preventScroll: true });
      window.scrollTo(0, 0);
    }
  }, [result, dialog]);

  if (!scoring.initial) return <LoadingScreen />;

  return (
    <>
      <main
        ref={main} tabIndex={result ? -1 : undefined}
        className={result
          ? "mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4 pb-14 focus:outline-none sm:p-8 lg:gap-8"
          : "scoring-main"}
      >
        <StorageMessages scoring={scoring} />
        {!scoring.session && (
          <section className="scoring-setup-panel">
            <header className="scoring-page-heading">
              <h1>Siapkan latihan</h1>
            </header>
            <Setup
              setup={scoring.setup} target={scoring.target}
              disabled={scoring.initial.blocked || scoring.initial.settingsError}
              onEdit={scoring.editSetup} onStart={scoring.start}
            />
          </section>
        )}
        {scoring.session && !result && <SessionScreen scoring={scoring} />}
        {result && (
          <>
            <PracticeResult practice={result} heading="h1" />
            <button
              type="button" onClick={scoring.restart}
              className="min-h-11 w-fit cursor-pointer rounded-xl border border-line bg-surface px-4 py-2
                self-end text-sm font-semibold hover:bg-surface-muted focus-visible:outline-2
                focus-visible:outline-offset-4 focus-visible:outline-primary"
            >
              Ulangi lagi
            </button>
            <PracticeEnds practice={result} />
          </>
        )}
      </main>
      <Alert
        {...scoring.dialog} title={scoring.dialog?.title ?? ""}
        show={Boolean(scoring.dialog)} pending={scoring.pending}
        onConfirm={scoring.confirm} onDismiss={scoring.closeDialog}
        onCancel={() => {
          if (scoring.pending) return;
          scoring.dialog?.onCancel?.();
          scoring.closeDialog();
        }}
      />
    </>
  );
}

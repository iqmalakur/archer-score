"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TargetBoard } from "@/components/scoring/TargetBoard";
import {
  createTarget, isValidTarget, MAX_RING_SCORE, readTargetSettings,
  TARGET_PRESETS, TARGET_SETTINGS_KEY,
} from "@/lib/target-settings";
import type { TargetConfig } from "@/types/target";

export function TargetSettings() {
  const [target, setTarget] = useState(createTarget);
  const [saved, setSaved] = useState<TargetConfig>(target);
  const [message, setMessage] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.resolve().then(() => {
      try {
        const stored = readTargetSettings(localStorage);
        setTarget(stored);
        setSaved(stored);
      } catch {
        setMessage("Target tersimpan tidak dapat dibaca. Data lama tidak dihapus; "
          + "periksa lalu simpan ulang jika diperlukan.");
      }
      setLoaded(true);
    });
  }, []);

  const updateRing = (id: string, patch: Partial<TargetConfig["rings"][number]>) => {
    setTarget((previous) => ({
      ...previous,
      rings: previous.rings.map((ring) => ring.id === id ? { ...ring, ...patch } : ring),
    }));
    setMessage("");
  };

  return (
    <main className="target-settings-page">
      <div className="scoring-page-heading">
        <p className="scoring-eyebrow">PREFERENSI LATIHAN</p>
        <h1>Setting target</h1>
        <p>Atur ring dari pusat ke luar. Skor ring minimal 1.</p>
      </div>
      <p className="scoring-notice">
        Perubahan hanya berlaku untuk sesi baru. Sesi aktif dan riwayat memakai target masing-masing.
      </p>

      <div className="target-editor-layout">
        <section className="target-preview-panel" aria-label="Preview target">
          <TargetBoard target={target} />
          <p>Setiap ring memiliki lebar radial yang sama.</p>
        </section>

        <form
          className="target-editor"
          onSubmit={(event) => {
            event.preventDefault();
            if (!isValidTarget(target)) return;
            try {
              localStorage.setItem(TARGET_SETTINGS_KEY, JSON.stringify(target));
              setSaved(structuredClone(target));
              setMessage("Target berhasil disimpan.");
            } catch {
              setMessage("Gagal menyimpan target. Perubahan masih tersedia di halaman ini. Silakan coba lagi.");
            }
          }}
        >
          <div className="target-presets" aria-label="Preset target">
            {TARGET_PRESETS.map((preset) => (
              <button
                key={preset.name} type="button"
                onClick={() => { setTarget(createTarget(preset.scores)); setMessage(""); }}
              >{preset.name}</button>
            ))}
          </div>
          <div className="scoring-toolbar">
            <h2>{target.rings.length} ring</h2>
            <button
              type="button" disabled={target.rings.length >= 10 || !loaded}
              onClick={() => setTarget({ ...target, rings: [...target.rings, {
                id: crypto.randomUUID(), score: 1, color: "#e9e7df",
              }] })}
            >+ Tambah ring</button>
          </div>
          <ol className="target-ring-editor">
            {target.rings.map((ring, index) => (
              <li key={ring.id}>
                <span className="ring-number">{index + 1}</span>
                <label>
                  <span className="sr-only">Warna ring {index + 1}</span>
                  <input
                    type="color" aria-label={`Warna ring ${index + 1}`}
                    value={ring.color}
                    onChange={(event) => updateRing(ring.id, { color: event.target.value })}
                  />
                </label>
                <label className="scoring-field">
                  Skor ring {index + 1}
                  <input
                    type="number" min={1} max={MAX_RING_SCORE} step={1} required
                    value={Number.isFinite(ring.score) ? ring.score : ""}
                    onChange={(event) => updateRing(ring.id, { score: event.target.valueAsNumber })}
                  />
                </label>
                <button
                  type="button" aria-label={`Hapus ring ${index + 1}`}
                  disabled={target.rings.length <= 1}
                  onClick={() => setTarget({ ...target, rings: target.rings.filter((item) => item.id !== ring.id) })}
                >×</button>
              </li>
            ))}
          </ol>
          <div className="scoring-actions">
            <button type="button" onClick={() => { setTarget(structuredClone(saved)); setMessage(""); }}>
              Batalkan perubahan
            </button>
            <button className="scoring-primary" disabled={!loaded || !isValidTarget(target)}>Simpan target</button>
          </div>
          {message && <p role="status" className="scoring-notice">{message}</p>}
          <Link className="scoring-text-link" href="/">← Kembali ke latihan</Link>
        </form>
      </div>
      <Link className="scoring-text-link" href="/arrow-preview">Lihat model panah bambu petung →</Link>
    </main>
  );
}

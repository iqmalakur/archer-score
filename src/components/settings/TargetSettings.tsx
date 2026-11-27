"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TargetBoard } from "@/components/scoring/TargetBoard";
import {
  createTarget, isValidTarget, MAX_RING_SCORE, readTargetSettings,
  TARGET_PRESETS, TARGET_SETTINGS_KEY,
} from "@/lib/target-settings";
import type { TargetConfig, TargetRing } from "@/types/target";

interface RingEditorProps {
  rings: TargetRing[];
  onEdit: (id: string, patch: Partial<TargetRing>) => void;
  onRemove: (id: string) => void;
}

function RingEditor({ rings, onEdit, onRemove }: RingEditorProps) {
  return (
    <ol className="target-ring-editor">
      {rings.map((ring, index) => (
        <li key={ring.id}>
          <input
            type="color"
            aria-label={`Warna ring ${index + 1}`}
            value={ring.color}
            onChange={(event) => onEdit(ring.id, { color: event.target.value })}
          />
          <label className="scoring-field">
            Skor ring {index + 1}
            <input
              type="number" inputMode="numeric" min={1} max={MAX_RING_SCORE} step={1} required
              value={Number.isFinite(ring.score) ? ring.score : ""}
              onChange={(event) => onEdit(ring.id, { score: event.target.valueAsNumber })}
            />
          </label>
          <button
            type="button" aria-label={`Hapus ring ${index + 1}`}
            disabled={rings.length <= 1}
            onClick={() => onRemove(ring.id)}
          >×</button>
        </li>
      ))}
    </ol>
  );
}

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

  const updateRing = (id: string, patch: Partial<TargetRing>) => {
    setTarget((previous) => ({
      ...previous,
      rings: previous.rings.map((ring) => ring.id === id ? { ...ring, ...patch } : ring),
    }));
    setMessage("");
  };

  return (
    <main className="target-settings-page">
      <header className="scoring-page-heading">
        <h1>Pengaturan target</h1>
        <p>Target yang disimpan berlaku untuk sesi latihan baru.</p>
      </header>

      <div className="target-editor-layout">
        <section className="target-preview-panel" aria-label="Pratinjau target">
          <div aria-hidden="true">
            <TargetBoard target={target} />
          </div>
          <div>
            <h2>Pratinjau target</h2>
            <p>{target.rings.length} ring</p>
          </div>
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
          <h2>Pilihan target</h2>
          <div className="target-presets" role="group" aria-label="Pilihan target">
            {TARGET_PRESETS.map((preset) => (
              <button
                key={preset.name} type="button"
                onClick={() => { setTarget(createTarget(preset.scores)); setMessage(""); }}
              >{preset.name}</button>
            ))}
          </div>
          <div className="scoring-toolbar">
            <div>
              <h2>Ring target</h2>
              <p>Dari pusat ke luar, skor minimal 1.</p>
            </div>
            <button
              type="button" disabled={target.rings.length >= 10 || !loaded}
              onClick={() => {
                setTarget({ ...target, rings: [...target.rings, {
                  id: crypto.randomUUID(), score: 1, color: "#e9e7df",
                }] });
                setMessage("");
              }}
            ><span aria-hidden="true">+ </span>Tambah ring</button>
          </div>
          <RingEditor
            rings={target.rings}
            onEdit={updateRing}
            onRemove={(id) => {
              setTarget({ ...target, rings: target.rings.filter((ring) => ring.id !== id) });
              setMessage("");
            }}
          />
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
      <div className="flex flex-wrap gap-x-4">
        <Link className="scoring-text-link" href="/arrow-preview">
          Lihat model panah bambu petung →
        </Link>
        <Link className="scoring-text-link" href="/landing">
          Tentang Panara
        </Link>
      </div>
    </main>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import type { ArrowView, createPetungViewer } from "./petung-arrow-viewer";

const views = [
  { id: "full", label: "Panah utuh" },
  { id: "point", label: "Ujung logam" },
  { id: "tail", label: "Bulu & nock" },
] as const;

export function PetungArrowPreview() {
  const container = useRef<HTMLDivElement>(null);
  const viewer = useRef<ReturnType<typeof createPetungViewer> | null>(null);
  const [view, setView] = useState<ArrowView>("full");
  const [status, setStatus] = useState("Memuat model panah…");

  useEffect(() => {
    let disposed = false;
    const failed = () => {
      if (!disposed) setStatus(
        "Preview 3D tidak tersedia. Aktifkan WebGL 2 lalu muat ulang halaman.",
      );
    };
    const ready = () => { if (!disposed) setStatus(""); };

    import("./petung-arrow-viewer").then(({ createPetungViewer }) => {
      if (disposed || !container.current) return;

      viewer.current = createPetungViewer(container.current, failed, ready);
      ready();
    }).catch(failed);

    return () => {
      disposed = true;
      viewer.current?.dispose();
      viewer.current = null;
    };
  }, []);

  return (
    <section className="petung-viewer" aria-label="Preview panah bambu petung">
      <div className="petung-viewer-top">
        <span className="petung-viewer-label">PETUNG / 01</span>
        <span className="petung-live"><i /> MODEL 3D</span>
      </div>

      <div className="petung-stage" ref={container} />
      {status && <p className="petung-status" role="status">{status}</p>}

      <div className="petung-viewer-bottom">
        <div className="petung-views" role="group" aria-label="Bagian panah">
          {views.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              aria-pressed={view === id}
              disabled={Boolean(status)}
              onClick={() => {
                viewer.current?.show(id);
                setView(id);
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="petung-rotate" role="group" aria-label="Putar model">
          <button
            type="button"
            aria-label="Putar panah ke kiri"
            disabled={Boolean(status)}
            onClick={() => viewer.current?.rotate(-1)}
          >←</button>
          <button
            type="button"
            aria-label="Putar panah ke kanan"
            disabled={Boolean(status)}
            onClick={() => viewer.current?.rotate(1)}
          >→</button>
        </div>
      </div>

      <p className="petung-hint">
        Geser untuk memutar · Cubit atau scroll untuk memperbesar
      </p>
    </section>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { PetungArrowPreview } from "@/components/scoring/PetungArrowPreview";
import "./preview.css";

export const metadata: Metadata = {
  title: "Panah Bambu Petung — Panara",
};

export default function ArrowPreviewPage() {
  return (
    <main className="petung-page">
      <div className="petung-intro">
        <Link className="petung-back" href="/">← Kembali ke latihan</Link>
        <p className="petung-eyebrow">PANARA / STUDI PANAH</p>
        <div className="petung-title-row">
          <div>
            <h1>Bambu <em>petung.</em></h1>
            <p className="petung-description">
              Serat alami. Ikatan tangan. Karakter tradisional.
            </p>
          </div>
          <span className="petung-version">MODEL PERTAMA <span>V.01</span></span>
        </div>
      </div>

      <PetungArrowPreview />

      <dl className="petung-details">
        <div>
          <dt>01 / BATANG</dt>
          <dd>Bambu warna madu<span>Serat memanjang dan ruas halus.</span></dd>
        </div>
        <div>
          <dt>02 / UJUNG</dt>
          <dd>Logam runcing<span>Ujung kerucut dengan soket logam.</span></dd>
        </div>
        <div>
          <dt>03 / BULU</dt>
          <dd>Krem & cokelat<span>Tiga bulu, ikatan benang, dan nock bercelah.</span></dd>
        </div>
      </dl>
    </main>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SITE_ORIGIN } from "@/lib/site-origin";
import styles from "./landing.module.css";

const title = "Panara — Aplikasi Pencatat Skor Panahan";
const description =
  "Catat skor latihan panahan di target digital, sesuaikan ring, dan tinjau riwayat latihan yang tersimpan di perangkat.";
const image = {
  url: new URL("/brand/panara-open-graph.jpg", SITE_ORIGIN),
  width: 1200,
  height: 630,
  alt: "Panara — Catat skor latihan panahan. Lima panah mengelompok di tengah target.",
};

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/landing" },
  robots: { index: true, follow: true },
  openGraph: {
    title,
    description,
    url: "/landing",
    siteName: "Panara",
    locale: "id_ID",
    type: "website",
    images: [image],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [image],
  },
};

export default function LandingPage() {
  return (
    <main className={styles.landing}>
      <LandingHero />
      <PracticeSteps />
      <BrowserInformation />
    </main>
  );
}

function StartPracticeLink() {
  return (
    <Link href="/" className={styles.startLink} prefetch={false}>
      Mulai latihan <span aria-hidden="true">→</span>
    </Link>
  );
}

function LandingHero() {
  return (
    <section className={styles.hero} aria-labelledby="landing-title">
      <div className={`${styles.shell} ${styles.heroInner}`}>
        <div>
          <h1 id="landing-title">
            Catat skor latihan panahan dengan <span>Panara</span>
          </h1>
          <p className={styles.heroDescription}>
            Tandai posisi anak panah di papan target digital dan lihat skor
            setiap rambahan saat berlatih.
          </p>
          <StartPracticeLink />
          <p className={styles.heroNote}>Langsung di browser, tanpa akun.</p>
        </div>

        <figure className={styles.heroPreview}>
          <div className={styles.heroFrame}>
            <video
              aria-label="Video latihan panahan"
              autoPlay
              loop
              muted
              playsInline
              disablePictureInPicture
              poster="/landing/practice-demo-poster.jpg"
              width={382}
              height={660}
            >
              <source
                src="/landing/practice-demo.mp4"
                type="video/mp4"
                media="(prefers-reduced-motion: no-preference)"
              />
              <a href="/landing/practice-demo.mp4">Unduh video demo latihan</a>
            </video>
          </div>
        </figure>
      </div>
    </section>
  );
}

function PracticeSteps() {
  return (
    <section
      className={`${styles.shell} ${styles.practice}`}
      aria-labelledby="practice-title"
    >
      <h2 id="practice-title">Cara mencatat skor panahan</h2>
      <ol className={styles.steps} role="list">
        <li>
          <h3>
            <span aria-hidden="true">1</span> Atur sesi latihan
          </h3>
          <p>
            Pilih target, atur jarak, lalu tentukan jumlah rambahan dan anak
            panah per rambahan.
          </p>
          <div className={styles.stepPreview}>
            <Image
              src="/landing/practice-setup.webp"
              alt="Pengaturan latihan pada jarak 8 meter dengan 4 rambahan dan 5 panah per rambahan"
              width={674}
              height={522}
              unoptimized
            />
          </div>
        </li>
        <li>
          <h3>
            <span aria-hidden="true">2</span> Tandai posisi panah
          </h3>
          <p>
            Letakkan panah di papan digital sesuai titik jatuhnya pada target.
            Panara menghitung skor per panah dan subtotal rambahan.
          </p>
          <div className={`${styles.stepPreview} ${styles.targetPreview}`}>
            <Image
              src="/landing/scoring-board.webp"
              alt="Papan target dengan lima anak panah di ring tengah"
              width={674}
              height={884}
              unoptimized
            />
          </div>
        </li>
        <li>
          <h3>
            <span aria-hidden="true">3</span> Tinjau hasil latihan
          </h3>
          <p>
            Lihat skor total, persentase, dan rincian tiap rambahan di{" "}
            <Link href="/history" prefetch={false}>
              Riwayat
            </Link>
            . Contoh hasil sesi lain di bawah menunjukkan 87 dari 120 poin.
          </p>
          <div className={styles.stepPreview}>
            <Image
              src="/landing/practice-result.webp"
              alt="Ringkasan hasil contoh latihan dengan skor 87 dari 120 dan persentase 72,5 persen"
              width={674}
              height={522}
              unoptimized
            />
          </div>
        </li>
      </ol>
    </section>
  );
}

function BrowserInformation() {
  return (
    <section className={styles.browser} aria-labelledby="browser-title">
      <div className={styles.shell}>
        <h2 id="browser-title">Riwayat dan penggunaan offline</h2>
        <dl className={styles.questions}>
          <div>
            <dt>Di mana riwayat latihan tersimpan?</dt>
            <dd>
              Riwayat tersimpan di browser yang Anda gunakan saat latihan.
              Menghapus data situs Panara dari browser juga menghapus riwayat
              dan sesi yang belum selesai.
            </dd>
          </div>
          <div>
            <dt>Bisakah Panara dipakai tanpa internet?</dt>
            <dd>
              Buka halaman Latihan saat terhubung ke internet agar Panara
              dapat menyiapkan fitur offline. Setelah persiapan selesai,
              halaman Latihan dan Riwayat dapat dibuka tanpa internet.
            </dd>
          </div>
        </dl>
        <StartPracticeLink />
      </div>
    </section>
  );
}

# Panara

*Setiap panah punya arah.*

A web app for recording archery practice scores. Configure ends (rambahan)
and arrows per end, place arrows on a target, and review your local history.

## Requirements

- Node.js **20.9 or newer**, as required by Next.js 16.3.0. Use a supported Node.js LTS release.
- **pnpm 12.21.0**, pinned in `package.json` via `packageManager`.

The app uses React 19.2.8, TypeScript 5, Tailwind CSS 4, Three.js, and Dexie for IndexedDB.

## Run locally

```bash
pnpm install
pnpm dev
```

Open [localhost:3000](http://localhost:3000). Development and production builds
use the default Next.js bundler and configuration.

```bash
pnpm build
pnpm start
```

## Usage

1. Open **Pengaturan** to customize ring count, colors, and scores. Ring scores must be positive integers.
   The default target has six rings: blue, white, red, yellow, yellow, yellow, from outside inward.
2. On **Latihan**, enter an optional title and an integer distance of 1–150 meters.
   Choose 1–20 ends and 1–12 arrows per end, then select **Mulai latihan**.
3. Tap the target to place an arrow, or hold, move, and release for precise aiming with a magnifier.
   Placements outside the circle but inside the box record a Miss with coordinates and add no points.
   Moving outside the box cancels the gesture and shows a red warning.
4. Select arrows through **Panahmu**. Use **Cabut** to remove one arrow or **Reset rambahan** to clear the active end.
   Empty slots require placement before advancing with **Lanjut**. Use **Kembali** to review earlier ends.
5. Confirm **Selesai** to save the practice and view the total, maximum score,
   percentage, and pass/fail status. A failed save keeps the draft and offers retry.
6. Open **Riwayat** to view details or delete a saved practice. Read/delete
   failures display an error and a retry action.

Drafts resume after a refresh. Each new session keeps its own target snapshot.
Changes in **Pengaturan** apply to new sessions. Existing sessions and history keep their saved target.
Legacy positive scores remain available without invented coordinates. Legacy zeros become empty slots that require review.
Escape dismisses the resume dialog without deleting the draft; use **Lanjutkan sesi tersimpan** to reopen it.

The procedural bamboo petung arrow preview remains available at `/arrow-preview`.
Scoring uses the same model, with a larger ready pose above the box and a shrinking flight animation.
The DOM target remains usable when WebGL is unavailable. Reduced motion disables flight and impact animation.

Confirmation dialogs support keyboard navigation, focus restoration, and Escape.
Escape is blocked while a save or deletion is in progress.

## Local storage

- `localStorage` stores setup preferences, target settings, theme, and one active draft
  (`endSession`). Tabs on the same origin share this draft slot; simultaneous
  independent sessions are not supported.
- IndexedDB (`ArcherScoreDB`) stores practice history and completion receipts.
  Receipts prevent stale drafts from saving a completed session twice and remain
  after history deletion to prevent the deleted practice from reappearing.
- Data stays in the current browser profile and origin. There is no account,
  cloud sync, or backup. Clearing site data removes drafts and history; private
  browsing or storage restrictions can limit persistence.
- Invalid drafts are kept until an explicit reset. A legacy draft whose setup
  has already been overwritten cannot have its original configuration recovered.
  If draft cleanup fails after saving, the completion receipt prevents resuming it.

## Offline history

Open Panara online first so it can cache the Practice and History pages and their required assets.
Once the cache is ready, you can open `/history` and reload details such as
`/history?id=1` offline in the browser that saved the practice.
If a page is unavailable offline, select **Kembali ke Latihan** to open the cached Practice page.
To retry the unavailable page, reconnect and select **Muat Ulang**.

## Checks

Install the browser once after installing dependencies:

```bash
pnpm exec playwright install chromium
```

```bash
pnpm test:unit  # scoring, target geometry, gestures, settings, drafts, arrow pose, and session identity
pnpm test:e2e   # browser regression tests, including a production build
pnpm test       # both suites
pnpm lint
```

Playwright starts a fresh production server at `http://127.0.0.1:3100` using
`pnpm build` and `pnpm start`. Keep port 3100 free. Each test has an isolated
browser context; tests do not access your regular browser's data. Browser tests
cover draft restoration, misses, distance validation, dialog keyboard behavior,
failed saves and retries, transaction rollback, duplicate completion, database
migration, and history read/delete errors. They currently run on Chromium.
Failure traces are saved under `test-results/` and excluded from Git.

## Project structure

```text
src/
├── app/                     # Next.js App Router
│   ├── fonts/               # Bundled Inter font and license
│   ├── page.tsx             # / — setup, scoring, results
│   ├── history/page.tsx     # /history and /history?id=1 — list and detail
│   ├── setting/page.tsx     # /setting — target colors and scores
│   └── arrow-preview/      # /arrow-preview — reusable petung model preview
├── components/
│   ├── scoring/             # Main, Setup, End, Result
│   ├── history/             # HistoryList, HistoryDetail
│   ├── layout/              # Header and navigation
│   └── Alert.tsx            # Native confirmation dialog
├── lib/                     # Database, scoring, validation, unit tests
└── types/                   # Setup and session types
tests/e2e/                   # Playwright tests and browser storage helpers
playwright.config.ts
```

## Font

Inter is loaded with `next/font/local` from `src/app/fonts/`.
The Latin variable WOFF2 font (weights 100–900) was downloaded from
[Google Fonts](https://fonts.google.com/specimen/Inter), using the
[official stylesheet](https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap).
Its SIL Open Font License is included in `src/app/fonts/OFL.txt`.
Font files live in the project; builds do not download fonts.

## License

This project is licensed under the [MIT License](LICENSE).

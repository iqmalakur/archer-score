# 🏹 ArcherScore

A web app for recording archery practice scores. Configure ends (rambahan),
arrows per end, and ring scores, then record scores and review your local history.

## Requirements

- Node.js **20.9 or newer**, as required by Next.js 16.3.0. Use a supported Node.js LTS release.
- **pnpm 12.21.0**, pinned in `package.json` via `packageManager`.

The app uses React 19.2.8, TypeScript 5, Tailwind CSS 4, and Dexie for IndexedDB.

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

1. On **Scoring**, enter an optional session title and an integer distance of
   1–150 meters. Choose 1–20 ends, 1–12 arrows per end, and at least one ring score.
2. Select **Mulai Scoring**. Each arrow offers exactly the ring scores selected
   in setup. Unfilled or cleared arrows count as misses worth **0**; no additional
   0/Miss choice is inserted. Move between ends with **Lanjut** and **Kembali**.
3. Confirm **Selesai** to save the practice and view the total, maximum score,
   percentage, and pass/fail status. A failed save keeps the draft and offers retry.
4. Open **Riwayat** to view details or delete a saved practice. Read/delete
   failures display an error and a retry action.

Drafts resume after a refresh. New drafts include their own setup snapshot, so
changing setup preferences in another tab does not change an active draft's
configuration. Older drafts use their saved setup preferences when valid and
gain a snapshot on resume. Escape dismisses the resume dialog without deleting
the draft; use **Lanjutkan sesi tersimpan** to reopen it.

Confirmation dialogs support keyboard navigation, focus restoration, and Escape.
Escape is blocked while a save or deletion is in progress.

## Local storage

- `localStorage` stores setup preferences, theme, and one active draft
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

## Checks

Install the browser once after installing dependencies:

```bash
pnpm exec playwright install chromium
```

```bash
pnpm test:unit  # score, title, setup/draft validation, session identity
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
│   ├── history/page.tsx     # /history — saved practices
│   ├── history/[id]/page.tsx # /history/:id — practice detail
│   └── setting/page.tsx     # /setting — placeholder
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

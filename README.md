# 🏹 ArcherScore

A web app for recording and calculating archery practice scores. Configure the number of ends, arrows per end, and target score values, then log each arrow's score and see results in real time.

## ✨ Features

- **Per-arrow scoring** — select scores via intuitive radio buttons for each end.
- **Flexible settings** — configure ends, arrows per end, and target score range.
- **Real-time results** — view total score, percentage, and pass/fail status with an animated ring chart.
- **Dark mode** — toggle light/dark theme with system preference support.
- **Responsive** — mobile-first design that works across all screen sizes.

## 🛠️ Tech Stack

| Technology                                   | Version |
| -------------------------------------------- | ------- |
| [Next.js](https://nextjs.org)                | 16.3.0  |
| [React](https://react.dev)                   | 19.2.8  |
| [TypeScript](https://www.typescriptlang.org) | ^5      |
| [Tailwind CSS](https://tailwindcss.com)      | ^4      |
| [pnpm](https://pnpm.io)                      | 11.10.0 |

## 📁 Project Structure

```
src/app/
├── layout.tsx              # Root layout (Inter font, metadata)
├── page.tsx                # Home page
├── globals.css             # Design tokens & global styles
└── components/
    ├── Main.tsx            # Main component (state management)
    ├── Setting.tsx         # Settings form (ends, arrows, scores)
    ├── End.tsx             # End card with per-arrow score input
    ├── Result.tsx          # Ring chart & results summary
    └── ThemeToggle.tsx     # Light/dark theme toggle
```

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) (≥ 18)
- [pnpm](https://pnpm.io) (≥ 11)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd archer-score

# Install dependencies
pnpm install
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build & Production

```bash
pnpm build
pnpm start
```

### Lint

```bash
pnpm lint
```

## 📖 Usage

1. **Open settings** — expand the "⚙️ Settings" section to configure the number of ends, arrows per end, and target scores.
2. **Record scores** — in each end, tap a score button for every arrow.
3. **View results** — scroll to the "🏆 Results" section to see total score, percentage, and pass/fail status.

## 📄 License

This project is licensed under the [MIT License](LICENSE).

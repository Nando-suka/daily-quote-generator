# Daily Quote Generator

> A refined, minimal web application that surfaces a new motivational quote on every visit — built with **Angular 22** and powered by **Supabase**.

![Daily Quote Generator Preview](docs/preview.png)

[![License: MIT](https://img.shields.io/badge/License-MIT-7a7893?style=flat-square)](LICENSE)
[![Angular](https://img.shields.io/badge/Angular-22-dd0031?style=flat-square&logo=angular)](https://angular.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ecf8e?style=flat-square&logo=supabase)](https://supabase.com)
[![Vitest](https://img.shields.io/badge/Vitest-Test-6e9f18?style=flat-square&logo=vitest)](https://vitest.dev)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Supabase Setup](#1-supabase-setup)
  - [Configure the App](#2-configure-the-app)
  - [Run Locally](#3-run-locally)
- [Testing](#testing)
- [Database Schema](#database-schema)
- [Architecture](#architecture)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**Daily Quote Generator** is a portfolio project demonstrating a clean separation of concerns between the **presentation layer** (Angular 22 with signals and OnPush change detection) and the **backend-as-a-service** (Supabase). Each page load fetches a randomly selected quote from a PostgreSQL database through the Supabase REST API, with no dedicated server required.

The design language follows a **refined editorial dark** aesthetic — warm gold accents against a deep, textured surface — prioritising legibility and typographic hierarchy.

---

## Features

| Feature | Description |
|---|---|
| Random Quotes | Efficiently selects a random record from the database without a full-table scan |
| Browse Library | Slide-in drawer with paginated quote browsing (5 per page, traditional page numbers) |
| Copy to Clipboard | One-click copying of the formatted quote + author attribution |
| Share on X / LinkedIn / Facebook | Opens pre-populated share intents with the quote |
| Library Stats | Displays the total number of quotes and the current quote's ID |
| Toast Notifications | Auto-dismissing feedback for user actions |
| Keyboard Shortcuts | Ctrl/Cmd+Alt+T (Twitter), Ctrl/Cmd+Alt+L (LinkedIn), Ctrl/Cmd+Alt+F (Facebook) |
| Animated UI | Smooth fade + slide transitions on every new quote reveal |
| Ambient Background | Animated gradient orbs provide depth without distraction |
| Fully Responsive | Adapts cleanly from 320px mobile to widescreen desktop |
| Accessible | Semantic HTML, ARIA labels, `aria-live` regions, and `prefers-reduced-motion` support |
| Runtime Validation | Zod schemas validate all data at the API boundary |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | Angular 22 (signals, OnPush, standalone-style component) |
| **Language** | TypeScript 6 (strict mode) |
| **Runtime Validation** | Zod 3.23 |
| **Backend / Database** | Supabase (PostgreSQL + REST API) |
| **Testing** | Vitest |
| **Formatting** | Prettier |
| **Typography** | Cormorant Garamond, DM Sans (Google Fonts) |
| **Styling** | Vanilla CSS with Custom Properties |

---

## Project Structure

```
daily-quote-generator/
├── src/
│   ├── index.html                     # App shell with CSP, OG tags, Google Fonts
│   ├── main.ts                        # Bootstrap entry point
│   ├── styles.css                     # Global styles (design tokens, animations)
│   ├── environments/
│   │   ├── environment.ts             # Development config (gitignored)
│   │   ├── environment.prod.ts        # Production config (gitignored)
│   │   └── environment.example.ts     # Template — commit this one
│   └── app/
│       ├── app.ts                     # Root component (signals, OnPush)
│       ├── app.html                   # Template (@if/@else control flow)
│       ├── app.css                    # Component styles
│       ├── app.spec.ts               # Component tests
│       ├── app.config.ts             # Application configuration
│       ├── quote-drawer/
│       │   ├── quote-drawer.ts       # Slide-in drawer component
│       │   ├── quote-drawer.html     # Drawer template
│       │   ├── quote-drawer.css      # Drawer styles
│       │   └── quote-drawer.spec.ts  # Drawer tests
│       └── core/
│           ├── quote.model.ts         # Zod schema + TypeScript type
│           ├── quote.model.spec.ts    # Schema validation tests
│           ├── supabase.config.ts     # DI injection token for config
│           ├── supabase.service.ts    # Data access service
│           └── supabase.service.spec.ts # Service tests
├── supabase/
│   └── schema.sql                     # Table definition, RLS policies & seed data
├── docs/
│   └── preview.png                    # README screenshot
├── angular.json                       # Angular CLI workspace config
├── tsconfig.json                      # TypeScript config (strict mode)
├── package.json                       # Dependencies and scripts
├── .prettierrc                        # Prettier config
├── .editorconfig                      # Editor config
├── .gitignore
├── LICENSE
└── README.md
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/) 10+
- A free [Supabase](https://supabase.com) account

---

### 1. Supabase Setup

**Step 1 — Create a new project**

1. Log in to [supabase.com](https://supabase.com) and click **New project**.
2. Give your project a name (e.g. `daily-quote-generator`), choose a region, and set a secure database password.
3. Wait for the project to initialise (~1 minute).

**Step 2 — Run the SQL schema**

1. In your Supabase dashboard, navigate to **SQL Editor**.
2. Click **New query**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql), and click **Run**.

This will:
- Create the `quotes` table with the correct columns.
- Enable **Row Level Security (RLS)** on the table.
- Add an anonymous read policy so the browser can query data without authentication.
- Insert 20 sample quotes to get you started.

**Step 3 — Retrieve your API credentials**

1. Go to **Project Settings → API**.
2. Copy your **Project URL** and **anon / public** key.

---

### 2. Configure the App

1. Copy the example environment file:

```bash
cp src/environments/environment.example.ts src/environments/environment.ts
cp src/environments/environment.example.ts src/environments/environment.prod.ts
```

2. Open both `src/environments/environment.ts` and `src/environments/environment.prod.ts` and replace the placeholder values with your Supabase credentials:

```typescript
export const environment = {
  production: false, // or true for environment.prod.ts
  supabaseUrl: 'https://xxxxxxxxxxxxxxxxxxxx.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
};
```

> **Security note:** The `anon` key is safe to expose in client-side code — it is intentionally public and controlled by your RLS policies. **Never** use your `service_role` key in the browser.

---

### 3. Run Locally

Install dependencies and start the dev server:

```bash
pnpm install
pnpm start
```

Then open [http://localhost:4200](http://localhost:4200) in your browser.

---

## Testing

Run the unit test suite:

```bash
pnpm test
```

Tests use [Vitest](https://vitest.dev/) with Angular's test utilities. Test files are located alongside their source files (e.g. `quote.model.spec.ts`, `supabase.service.spec.ts`).

---

## Database Schema

```sql
CREATE TABLE public.quotes (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  content    TEXT         NOT NULL,
  author     VARCHAR(120) NOT NULL DEFAULT 'Unknown',
  category   VARCHAR(60),
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

### Adding More Quotes

Insert additional quotes directly from the Supabase Table Editor, or via SQL:

```sql
INSERT INTO public.quotes (content, author, category)
VALUES ('Your quote text here.', 'Author Name', 'category');
```

---

## Architecture

The application follows a modern Angular 22 architecture with reactive state management:

```
┌─────────────────────────────────────────────────────┐
│                   Browser (Client)                    │
│                                                       │
│  ┌─────────────────┐       ┌──────────────────────┐  │
│  │  App Component   │──────▶│  SupabaseService     │  │
│  │  (signals, OnPush)│      │  (providedIn: root)  │  │
│  └────────┬─────────┘       └──────────┬───────────┘  │
│           │                            │               │
│           ▼                            ▼               │
│      app.html              @supabase/supabase-js      │
│   (Angular Template)               │                   │
└────────────────────────────────────┼───────────────────┘
                                     │ HTTPS / REST API
                         ┌───────────▼───────────┐
                         │     Supabase Cloud     │
                         │  PostgreSQL: quotes    │
                         │  (RLS: read-only)      │
                         └───────────────────────┘
```

**Key design decisions:**

- **Signals** for reactive state (`signal<Quote | null>(null)`) — no manual `ChangeDetectorRef` needed.
- **`ChangeDetectionStrategy.OnPush`** for optimal rendering performance.
- **`SupabaseService`** encapsulates all database interactions. The component never touches the Supabase client directly — this makes the data layer independently testable and swappable.
- **Zod runtime validation** at the API boundary ensures data shape matches the TypeScript `Quote` type.
- **Random selection strategy:** Rather than `ORDER BY RANDOM()` (which scans the full table), the app fetches the row count first, generates a random offset, then fetches a single row at that offset — an O(log n) operation via the primary key index.
- **Environment-based configuration** with `fileReplacements` in `angular.json` to swap credentials between development and production builds.

---

## Deployment

The application requires a build step before deployment.

### Build for Production

```bash
pnpm build
```

This outputs static files to `dist/daily-quote-generator/browser/`.

### Deploy to Vercel

```bash
pnpm i -g vercel
vercel --public
```

### Deploy to Netlify

1. Build the project: `pnpm build`
2. Drag-and-drop the `dist/daily-quote-generator/browser/` folder onto [app.netlify.com/drop](https://app.netlify.com/drop).

### Deploy to GitHub Pages

1. Build the project: `pnpm build`
2. Push the `dist/daily-quote-generator/browser/` contents to the `gh-pages` branch.

---

## Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository.
2. Create a feature branch: `git checkout -b feat/your-feature-name`
3. Commit your changes: `git commit -m "feat: add your feature description"`
4. Push to the branch: `git push origin feat/your-feature-name`
5. Open a Pull Request.

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

---

## License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for full details.

---

<p align="center">
  Built with ♥ using <a href="https://angular.dev">Angular</a> &amp; <a href="https://supabase.com">Supabase</a>
</p>

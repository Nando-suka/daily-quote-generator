# ✦ Daily Quote Generator

> A refined, minimal web application that surfaces a new motivational quote on every visit — built with **AngularJS** and powered by **Supabase**.

![Daily Quote Generator Preview](docs/preview.png)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-View%20Site-c9a96e?style=flat-square)](https://your-demo-url.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-7a7893?style=flat-square)](LICENSE)
[![AngularJS](https://img.shields.io/badge/AngularJS-1.8.3-e03737?style=flat-square&logo=angularjs)](https://angularjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ecf8e?style=flat-square&logo=supabase)](https://supabase.com)

---

## 📖 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Supabase Setup](#1-supabase-setup)
  - [Configure the App](#2-configure-the-app)
  - [Run Locally](#3-run-locally)
- [Database Schema](#database-schema)
- [Architecture](#architecture)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**Daily Quote Generator** is a portfolio project demonstrating a clean separation of concerns between the **presentation layer** (AngularJS) and the **backend-as-a-service** (Supabase). Each page load fetches a randomly selected quote from a PostgreSQL database through the Supabase REST API, with no dedicated server required.

The design language follows a **refined editorial dark** aesthetic — warm gold accents against a deep, textured surface — prioritising legibility and typographic hierarchy.

---

## Features

| Feature | Description |
|---|---|
| 🎲 **Random Quotes** | Efficiently selects a random record from the database without a full-table scan |
| 📋 **Copy to Clipboard** | One-click copying of the formatted quote + author attribution |
| 🐦 **Share on X (Twitter)** | Opens a pre-populated tweet intent with the quote and relevant hashtags |
| 📊 **Library Stats** | Displays the total number of quotes and the current quote's ID |
| ✨ **Animated UI** | Smooth fade + slide transitions on every new quote reveal |
| 🌑 **Ambient Background** | Animated gradient orbs provide depth without distraction |
| 📱 **Fully Responsive** | Adapts cleanly from 320px mobile to widescreen desktop |
| ♿ **Accessible** | Semantic HTML, ARIA labels, and `prefers-reduced-motion` support |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | AngularJS 1.8.3 + ngAnimate |
| **Backend / Database** | Supabase (PostgreSQL + REST API) |
| **Typography** | Cormorant Garamond · DM Sans (Google Fonts) |
| **Styling** | Vanilla CSS with Custom Properties (design tokens) |
| **Hosting** | Any static host (Vercel, Netlify, GitHub Pages) |

> **Why AngularJS 1.x?** This project intentionally uses AngularJS (not Angular 2+) to demonstrate proficiency with the classic MVC framework, service injection, and `controllerAs` syntax — skills still found in many enterprise codebases.

---

## Project Structure

```
daily-quote-generator/
├── src/
│   ├── index.html              # App shell (AngularJS bootstrap)
│   └── assets/
│       ├── css/
│       │   └── style.css       # Full stylesheet with CSS variables
│       └── js/
│           └── app.js          # Module · Service · Controller
├── supabase/
│   └── schema.sql              # Table definition, RLS policies & seed data
├── docs/
│   └── preview.png             # README screenshot
├── .gitignore
├── LICENSE
└── README.md
```

---

## Getting Started

### Prerequisites

- A free [Supabase](https://supabase.com) account
- A modern web browser
- A local static file server (e.g. [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) for VS Code, or `npx serve`)

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

Open `src/assets/js/app.js` and replace the placeholder values in the `SUPABASE_CONFIG` constant:

```javascript
.constant("SUPABASE_CONFIG", {
  url:     "https://xxxxxxxxxxxxxxxxxxxx.supabase.co",  // ← Your Project URL
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."   // ← Your anon key
})
```

> ⚠️ **Security note:** The `anon` key is safe to expose in client-side code — it is intentionally public and controlled by your RLS policies. **Never** use your `service_role` key in the browser.

---

### 3. Run Locally

**Option A — VS Code Live Server**

Right-click `src/index.html` and select **Open with Live Server**.

**Option B — npx serve**

```bash
npx serve src
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

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

The application follows the **AngularJS component architecture** with a clean data-access layer:

```
┌─────────────────────────────────────────────────┐
│                   Browser (Client)               │
│                                                  │
│  ┌──────────────┐       ┌────────────────────┐  │
│  │ QuoteController│◄────│  SupabaseService   │  │
│  │  (View Logic) │      │  (Data Access Layer)│  │
│  └──────┬───────┘       └─────────┬──────────┘  │
│         │                         │              │
│         ▼                         ▼              │
│     index.html              Supabase JS Client   │
│   (AngularJS View)                │              │
└───────────────────────────────────┼─────────────┘
                                    │ HTTPS / REST API
                        ┌───────────▼───────────┐
                        │     Supabase Cloud     │
                        │  ┌─────────────────┐  │
                        │  │  PostgreSQL DB  │  │
                        │  │  quotes table   │  │
                        │  └─────────────────┘  │
                        └───────────────────────┘
```

**Key design decisions:**

- **`SupabaseService`** encapsulates all database interactions. The controller never touches the Supabase client directly — this makes the data layer independently testable and swappable.
- **`$q` promises** are used to bridge the native Promises returned by the Supabase client with AngularJS's digest cycle, ensuring the view updates reliably.
- **Random selection strategy:** Rather than `ORDER BY RANDOM()` (which scans the full table), the app fetches the row count first, generates a random offset, then fetches a single row at that offset — an O(log n) operation via the primary key index.

---

## Deployment

This is a purely static application — no build step required.

### GitHub Pages

```bash
# From the repo root
git subtree push --prefix src origin gh-pages
```

Then enable GitHub Pages in your repo **Settings → Pages → Branch: gh-pages**.

### Vercel

```bash
npm i -g vercel
vercel --public
```

Set the **Root Directory** to `src` in the Vercel project settings.

### Netlify

Drag-and-drop the `src/` folder onto [app.netlify.com/drop](https://app.netlify.com/drop).

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
  Built with ♥ using <a href="https://angularjs.org">AngularJS</a> &amp; <a href="https://supabase.com">Supabase</a>
</p>

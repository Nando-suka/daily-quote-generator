## Project Overview

Daily Quote Generator — Angular 22 + Supabase web app that surfaces random motivational quotes.

## Tech Stack

- **Framework**: Angular 22 (standalone components, signals, OnPush change detection)
- **Language**: TypeScript 6 (strict mode)
- **State**: Angular signals
- **Backend**: Supabase (PostgreSQL + REST API, anonymous read-only access)
- **Validation**: Zod runtime schemas at the API boundary
- **Styling**: Vanilla CSS with custom properties (design tokens in `src/styles.css`)
- **Testing**: Vitest + Angular testing utilities (`.spec.ts` alongside source)
- **Linting**: ESLint with `angular-eslint` and `typescript-eslint`
- **Formatting**: Prettier (printWidth 100, single quotes)

## Project Structure

```
src/
  main.ts              # Bootstrap entry point
  styles.css           # Global styles (design tokens, animations)
  index.html           # App shell (CSP, fonts, OG tags)
  environments/        # Environment configs (gitignored except .example.ts)
  app/
    app.ts             # Root shell component
    app.html           # Shell template (header, router-outlet, footer)
    app.config.ts      # DI providers, router, error handler, app initializer
    app.routes.ts      # Routes: / (home), /quote/:id (detail), ** -> /
    core/
      quote.model.ts           # Zod schema + Quote type
      supabase.service.ts      # Data access (count, random, paginated, by-id, categories)
      supabase.config.ts       # Injection token for env config
      share.service.ts         # Share URLs, clipboard, window opening
      error-handler.ts         # Global error handler
    pages/
      home/             # Home page: random quote, categories, drawer
      quote-detail/     # /quote/:id page: SEO, shareable permalink
    quote-drawer/       # Slide-in library drawer with pagination
    shared/
      quote-card/       # Presentational quote card + action row
```

## Key Conventions (Updated)

- **Components**: Standalone, `OnPush`, `input()`/`output()` signals, `templateUrl`/`styleUrl`
- **Services**: `@Service()` decorator (not `@Injectable({providedIn: 'root'})`) for singleton services
- **State**: `signal()` for reactive state; `computed()` for derived values
- **Validation**: All Supabase responses parsed through `QuoteSchema.parse()` (Zod)
- **Tests**: Vitest, colocated as `*.spec.ts`, use `TestBed` + `vi` (vitest globals)
- **Styling**: CSS custom properties (`--color-*`, `--space-*`, `--radius-*`, etc.); BEM-like class naming
- **Commits**: Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, etc.)
- **Host Event Handlers**: Use `host` object in `@Component` decorator instead of `@HostListener` decorator
- **Host Bindings**: Use `host` object in `@Component` decorator instead of `@HostBinding` decorator
- **Dependency Injection**: Use `inject()` function instead of constructor injection for services

## Commands

| Command | Purpose |
|---------|---------|
| `pnpm install` | Install dependencies |
| `pnpm start` / `pnpm dev` | Dev server at http://localhost:4200 |
| `pnpm build` | Production build to `dist/` |
| `pnpm test` | Run vitest unit tests |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Prettier write |
| `pnpm format:check` | Prettier check |

## Supabase Setup

1. Create a Supabase project
2. Run `supabase/schema.sql` in the SQL Editor
3. Copy Project URL + anon key to `src/environments/environment.ts` (and `.prod.ts`)
4. Use `environment.example.ts` as template; real env files are gitignored

## Notes

- The app works offline without Supabase credentials (shows a connection error)
- Service worker (`public/sw.js`) provides basic offline caching
- Keyboard shortcuts: Ctrl/Cmd+Alt+T (X), Ctrl/Cmd+Alt+L (LinkedIn), Ctrl/Cmd+Alt+F (Facebook), Escape (close drawer)
- `window.Sentry` reference in `error-handler.ts` is defensive — Sentry is not installed
- ESLint configuration uses flat config system (requires Node.js 20+)
- @HostListener decorators have been removed and replaced with host object event handlers
- @HostBinding decorators have been removed and replaced with host object properties
- @Injectable decorators have been replaced with @Service decorators for singleton services
- Constructor injection has been replaced with inject() function for service dependencies

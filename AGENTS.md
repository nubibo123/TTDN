# AGENTS.md

Full-stack university admission consulting platform: **Spring Boot (Backend) + React + Vite (Frontend) + PostgreSQL (DB)**.

## Architecture
- `backend/` — Spring Boot 3.4.5, JPA, Flyway, JWT. Package `com.admitconsult`. Entry `BackendApplication.java`.
- `web/` — Vite + React 19 + Tailwind v4 + react-router-dom v7. Entry `web/index.html` → `web/src/main.tsx`.
- `prisma/` — legacy reference only. Do NOT use `prisma migrate` (schema is now Spring-Flyway-managed).
- `docs/` — placeholder for future docs.

## Setup & Commands
Root `package.json` delegates everything; **run from `/` unless noted**.

| Command | What it does |
| --- | --- |
| `npm run dev` | Frontend Vite dev server on `:5173` |
| `npm run build` | Frontend typecheck + Vite build |
| `npm run backend:dev` | Spring Boot on `:8080` |
| `npm run backend:build` | `mvn clean package -DskipTests` |
| `npm run backend:test` | `mvn test` |
| `npm run web:install` | `npm install` in `web/` |

## Database (PostgreSQL 18, localhost:5432)
- Credentials: `postgres / 123456`, DB `postgres` — `backend/src/main/resources/application.properties`.
- Service: `postgresql-x64-18` (Windows service). Start manually via `Get-Service postgresql-x64-18`.
- **Flyway Migrations:** Schema owned by Flyway (`V2` to `V4`). `spring.jpa.hibernate.ddl-auto=validate`.
- Fresh DB setup: Set `ddl-auto=update` once, then revert to `validate`.

## Auth & API
- **JWT:** HS256. Secret in `application.properties` (must be ≥32 chars).
- **Endpoints:** 
  - Public: `/api/auth/**`, `/api/health`, `GET /api/universities`, `/api/majors`, `/api/admission-scores`, `/api/forum-categories`, `/api/forum-threads`, `/api/forum-posts`.
  - Authenticated: All others via `Authorization: Bearer <token>`.
- **Matching:** `POST /api/match` computes likelihoods server-side based on input scores.
- **OCR Proxy:** Vite proxy `/ocr-proxy` → `ngrok` upstream. Use `VITE_OCR_ENDPOINT` env var for overrides.
- **CORS:** `localhost:5173`, `:5174`, `:3000` allow-listed. Restart backend after changes.

## Frontend Patterns
- **UI Primitives:** Hand-rolled in `web/src/components/ui/` (`Card`, `Button`, `Badge`, `Input`, `Avatar`, `Tabs`, `Skeleton`, `VantaWavesHero`).
- **API Client:** `web/src/lib/api.ts` (`fetchApi<T>` wraps JWT from `authContext`).
- **Tailwind Tokens:** Defined in `web/src/index.css` via `@theme`. Use `--color-navy-*`, `--color-cream-*`, `--color-gold-*`, `--color-slate-*`. No inline hex.
- **Motion/Reveal:** 
  - `BlurReveal` component (IntersectionObserver wrapper).
  - CSS classes: `.mb-settle`, `.mb-reveal`, `.mb-row`, `.mb-accordion`, `.mb-skel` (shimmer).
  - Legacy `.reveal` / `.blur-reveal` classes still exist but `mb-*` is the new standard.

## File Conventions
- **Backend:** Use Lombok (`@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder`). IDs are String UUIDs via `@GeneratedValue(strategy = GenerationType.UUID)`.
- **Frontend:** Use `@/` alias for imports. components in `web/src/components/blocks/` for landed sections.

## Known Gotchas
- **PowerShell 5.1:** No `&&`. Use `; if ($?) { ... }`. Quote `@` packages: `npm install "@scope/pkg"`.
- **Git:** `.gitconfig` may have invalid paths on Windows; prefer direct file edits over git if fatal path errors occur.
- **Vite Cache:** After backend changes, run `cd web && npx vite --force` if CSS/PostCSS errors occur.
- **OCR Fallback:** `web/src/lib/gemini.ts` provides demo-score fallbacks when upstream server (500/Network Error) is unreachable.

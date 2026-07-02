# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from the `website/` directory.

- `npm run dev` — start the dev server (http://localhost:3000)
- `npm run build` — production build
- `npm start` — serve a production build
- `npm run lint` — run ESLint (`eslint-config-next`)

No automated test suite is in the repo (Cypress E2E and Postman API tests are done out-of-band).

## Stack

Next.js 16 (App Router) + React 19, plain JavaScript (no TypeScript). Styling is CSS Modules (`*.module.css`) plus design tokens in `src/app/globals.css`. `@/*` maps to `./src/*` (`jsconfig.json`). Backend is Next.js API routes (`src/app/api/**`) over a libSQL/Turso (SQLite) database; passwords are bcrypt-hashed; password-reset emails go through Resend.

Env vars: `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` (falls back to a local `file:data/local.db` in dev), `RESEND_API_KEY` / `RESEND_FROM`, `NEXT_PUBLIC_BASE_URL`.

## Architecture

The app is a landing/auth shell around a daily Snake game with leaderboards, achievements, and unlockable snake colors/titles. All page components are `"use client"`.

**Database** (`src/lib/db.js`). `initDb()` lazily creates the schema on first call and returns the shared client; every route handler awaits it. Tables: `users`, `scores`, `attempts`, `password_reset_tokens`, `user_achievements`. There is real persistence — the older "mock auth, no DB" model is gone.

**Sessions are client-side; auth is real.** The session is a `user` object in `localStorage` written after a successful `/api/auth/*` call. Pages gate on its presence (no server-side session). When you change the auth contract, keep the API response shape and the `localStorage` reads in sync.

**Host / guest flow.** `/host` writes a fake guest user `{ email: "host@platform.local" }` and sets an **in-memory** `window.__hostSession` flag, then client-navigates to `/game`. That flag survives client navigation but not a full page load, so `/game` redirects a host back to `/` on reload (guests can't deep-link in). Guests are also redirected away from `/profile`. Host play is session-only: attempts, leaderboard saves, and achievements are skipped for `host@platform.local`.

**Auth "views" live on the landing page, not as routes.** `src/app/page.js` renders `login` / `register` / `forgotPassword` as in-page view states. Deep-link with `/?view=<name>` where `<name>` must exactly match the camelCase view (`login`, `register`, `forgotPassword`) — a mismatched value (e.g. kebab-case) renders a blank card. The game page's auth dropdown navigates here via `goToAuth(view)` → `/?view=<view>`. The real routes are `/game`, `/profile`, `/about`, `/host`, `/reset-password`, and `/setup` (under the `(auth)` route group, so the URL is `/setup`).

**Game engine** (`src/app/game/useSnakeGame.js`). Owns the canvas render loop and logic via refs; communicates out through `onGameOver` and a `disabled` prop. The wall map is **deterministically seeded by date** (`generateDailyWalls`) so every player gets the same board each day; the date comes from `/api/time` (server clock), not the client. Daily attempt limit is enforced via `/api/attempts` (`MAX_ATTEMPTS = 3`). Scoring: yellow food = 10, red "special" food = 30 (time-limited). Editing wall shapes changes the seeded sequence, so the whole map regenerates.

**Achievements & rewards = config vs. text, coupled by id.**
- `src/lib/achievements.js` holds language-agnostic *logic*: `ACHIEVEMENTS` (each `{ id, rewardType, rewardValue(s), hidden }`), `THEMES` (snake colors with glow/pattern flags), `GLOWING_COLORS`.
- The *display* name/description live in the locale files as `ach_<id>_name` / `ach_<id>_desc`. Code looks them up dynamically: `t(\`ach_${ach.id}_name\`)`, and equipped titles via `t(\`title_${id}\`)`.
- Invariant: every `ACHIEVEMENTS` id needs matching `ach_<id>_*` keys in **both** locales. Evaluation runs server-side (`/api/achievements/evaluate`); equipping a color/title is `/api/profile/equip`; the end-of-day reward roulette is `/api/rewards`.

**i18n** (`src/lib/LanguageContext.js`). `useTranslation()` gives `{ t, lang, switchLang }`; `t(key)` returns the key (and logs `Translation missing for key: …`) when absent. Translations are one file per locale in `src/lib/locales/{en,cs}.js`, aggregated by `src/lib/dictionaries.js`. **Keep the two locales in key parity** — every `t("…")` key (static and the dynamic `ach_*` / `title_*` ones) must exist in both. To find drift, watch the console warning, or diff the key sets of the two locale modules.

**Game-page layout is absolutely-positioned around a centered column.** In `gameLayout.module.css`, `.content` flex-centers `.gameSection`, while `.infoSection` (left) and `.leaderboardSection` (right) are `position: absolute` relative to it; below 1400px they un-position and stack. Because only `.gameSection` is in the flex flow, do **not** add in-flow siblings to `.content` — nest extra content inside `.gameSection` instead, or you break the centering.

**Single source of truth for shared UI text/components.** The terms text exists only as locale keys rendered by `src/components/TermsModal.js` (there is no standalone `/terms` route). Auth forms in `src/components/auth/` (`LoginForm`, `RegisterForm`, `ForgotPasswordForm`, plus the custom `Select` / `CountryCombobox` / `DatePicker` / `PasswordInput`) are shared between the landing page and the game-page auth dropdown.

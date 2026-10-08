# FlowDesk frontend

Next.js 16 (App Router), React 19, TypeScript and Tailwind frontend for FlowDesk, a
production-style IT service management application (tickets, role-based workflow, SLAs,
notifications, audit log). The API, business rules and full project documentation live in
the Spring Boot backend: [FlowDesk](https://github.com/JaiswalS2812/FlowDesk-).

**Live demo:** https://flowdesk-demo.up.railway.app

## Role of this application

- Renders the UI: sign-in and registration, a role-aware dashboard, the ticket list (filters,
  sorting and paging kept in the URL), ticket detail (workflow actions, assignment, live SLA
  meters, lifecycle, conversation), new ticket, account, Help Center, and the admin pages for
  users, SLA policies and the audit log.
- Holds the JWT after sign-in (`localStorage`) and sends it as `Authorization: Bearer` on
  every API call (`src/lib/api-client.ts`), signing the user out on **401**.
- Hides pages and actions a role cannot use (`useRequireAuth`, `components/layout/nav.ts`).
  This is for usability only: every permission is enforced again by the backend.
- Acts as the only public entry point: its Node.js server proxies `/api/*` to the backend, so
  the browser never talks to the backend directly.

```mermaid
flowchart LR
    browser([Browser]) -->|"pages + /api/* (same origin)"| next["Next.js server<br/>(this repository)"]
    next -->|"/api/* rewrite<br/>BACKEND_API_URL"| api["Spring Boot API<br/>(FlowDesk repository)"]
    api --> db[(MySQL)]
```

Project layout: `app/` (routes; `(auth)/` sign-in and registration share one layout,
`(protected)/` requires sign-in), `src/components/ui/` (design-system primitives),
`src/components/layout/` (app shell, navigation, command menu, footer),
`src/components/assistant/`, `src/components/notifications/`, `src/services/` (one API module
per backend area), `src/lib/api-client.ts` (fetch wrapper, token and error handling),
`src/contexts/` (auth and theme), `src/content/help.ts` (Help Center articles), `src/types/`.

## Design system

- **Tokens** live in `app/globals.css`: surfaces, text, lines, accent, focus ring, elevation,
  radius, motion, and ten colour *tones* (each with a soft fill, readable foreground, border and
  solid colour). Tailwind CSS 4 exposes them as utilities (`bg-surface`, `text-fg-muted`,
  `border-line`, `bg-red-bg` …); components never hard-code a palette.
- **Semantic mapping** in `src/utils`: ticket status, priority, role, SLA level and audit action
  each map to a tone, so badges stay consistent and readable everywhere.
- **Three themes**: Light, Dark and Warm (a low-glare paper theme with a copper accent), plus
  *System*, which follows the OS light/dark setting. Each theme defines every token, including
  status colours, shadows, inputs, overlays and skeletons. The choice is saved in
  `localStorage` and applied by a small inline script before first paint, so there is no flash;
  the collapsed-sidebar state is restored the same way.
- **Components** (`src/components/ui`): Button/IconButton, Input, PasswordInput (visibility
  toggle), Textarea (character counter), native Select, password checklist (mirrors the
  backend policy), Badge, Card, Table (fixed column widths, wrapping cells), Pagination,
  Modal/ConfirmDialog (Radix Dialog: focus trap, Escape, focus return), Menu (Radix Dropdown),
  Tooltip (Radix), SegmentedControl, Switch, Avatar, AnimatedNumber, Toast, Skeleton,
  EmptyState, ErrorState, Alert.
- **Motion** is CSS-only (no animation library): short entrance and stagger animations,
  Radix open/close states, counters and progress bars. Everything respects
  `prefers-reduced-motion`.
- **Tables** use `table-layout: fixed` with explicit widths: long text (audit details, emails)
  wraps inside its column instead of pushing later columns out of view. The audit log uses a
  container query, so collapsing the sidebar gives it the room to switch from stacked entries to
  the full table; phones get card layouts.

## Assistant, command menu and Help Center

- **Command menu** (`Ctrl/⌘ K`, built with `cmdk`): jump to pages, open a ticket by number,
  search tickets through the regular API (only tickets the user may see), find help articles,
  switch theme, sign out.
- **FlowDesk Assistant** (corner button): a rule-based helper, **not** an AI model. It
  recognises a small set of requests (a ticket by number, SLA risks, workload summary, unread
  notifications, ticket lists by status) and answers them from the user's own data through the
  normal authorised API, and answers how-to questions from the Help Center content. Anything
  else is routed to a human by creating a ticket. Adding a language model would need a backend
  endpoint holding the provider key (never the browser), retrieval over tickets the caller may
  see, and usage limits; none of that exists yet.
- **Help Center** (`/help`): searchable, accurate product documentation by category; articles
  are deep-linkable (`/help#article-id`). There are no invented contact details: "contact
  support" means creating a ticket.
- **Not available** in this deployment, and not shown as working: password reset by email,
  email verification, real-time push (notifications are polled once a minute).

## Dependencies

Next.js 16, React 19, Tailwind CSS 4, `lucide-react` (icons), Radix UI Dialog / Dropdown Menu /
Tooltip (accessible primitives), `cmdk` (command menu), `clsx` + `tailwind-merge` (class names).
Fonts (Geist) are self-hosted by `next/font`. Charts are plain CSS bars; no charting or
animation library is shipped.

## How it talks to the backend

The browser calls `/api/*` on this server only. `next.config.ts` rewrites (proxies) those
requests to `BACKEND_API_URL` (default `http://localhost:8080`). The backend address is
therefore never exposed to the browser and no CORS setup is needed.

`BACKEND_API_URL` is read when the app is **built** (`next build` writes the rewrite into the
server's routes manifest), so set it before building; changing it requires a rebuild. It is
not a `NEXT_PUBLIC_` variable and does not appear in browser JavaScript.

Notifications are fetched over the same API: the bell polls the unread count once a minute
while the tab is visible, shows a toast when new ones arrive, and loads the list when opened
(no WebSockets or server push).

### Client IP forwarding

The backend's login throttling counts failures per client IP and reads it from
`X-Forwarded-For` when the request comes from this server. The Next.js rewrite proxy passes
that header through unchanged and does not add the client's address, so the production server
runs with `forwarded-for.mjs` preloaded (`npm start` and the Docker image both do). It appends
the address of each incoming connection, like a standard reverse proxy, so a client cannot
choose the IP the backend sees. Run the production server through `npm start`, not plain
`next start`.

Behind a platform edge proxy that every request must pass through, set `CLIENT_IP_HEADER` to
the header that edge always overwrites with the client IP (`x-real-ip` on Railway). The
preload then uses that header as `X-Forwarded-For` instead of the connection address, which
would be the edge's. Leave it unset when clients connect directly (Docker Compose).

## Environment variables

| Variable | When | Purpose |
|---|---|---|
| `BACKEND_API_URL` | build time | Backend base URL for the `/api/*` rewrite (server-side only) |
| `CLIENT_IP_HEADER` | runtime | Edge header carrying the client IP (`x-real-ip` on Railway); unset locally |
| `PORT` | runtime | Server port (default `3000`) |

None of these is a secret. `.env*` files are git-ignored and excluded from the Docker image.

## Local development

The simplest way to run everything is the Docker Compose stack in the backend repository
(see its README, "Local development"). To run only the frontend against a backend on
`localhost:8080`:

```bash
npm install
echo BACKEND_API_URL=http://localhost:8080 > .env.local   # git-ignored
npm run dev
```

Open http://localhost:3000. Production build without Docker: `npm run build`, then
`npm start`.

## Production (Railway)

Deployed as the `frontend` service of the Railway project described in the backend README:
the only service with a public domain (HTTPS at Railway's edge, port 3000, health check
`/login`). `BACKEND_API_URL` points to the backend's private domain
(`http://backend.railway.internal:8080`), so API traffic stays on Railway's private network,
and `CLIENT_IP_HEADER=x-real-ip`. Deploy with `railway up --service frontend`.

## Docker

The image is built and run by the Docker Compose stack in the backend repository
(`docker-compose.yml` there), which passes `BACKEND_API_URL=http://backend:8080` as a build
argument. To build the image on its own:

```bash
docker build --build-arg BACKEND_API_URL=http://backend:8080 -t flowdesk-frontend .
```

The `Dockerfile` installs dependencies and runs `next build` with `NEXT_OUTPUT_STANDALONE=1`
(enables `output: "standalone"`), then copies only the standalone server and
`forwarded-for.mjs` into a `node:22-alpine` runtime image that runs as the non-root `node`
user on port 3000. Development dependencies, sources and `.env*` files are not part of the
runtime image.

## Security headers

`next.config.ts` sends a Content-Security-Policy (same-origin only: fonts are self-hosted, so no
external origin is allowed), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
`Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy` and
`Strict-Transport-Security` on every page, and removes `X-Powered-By`. Inline scripts remain
allowed for Next.js bootstrap and the theme script. TLS is terminated by the hosting edge
(Railway in production).

## End-to-end tests

Playwright tests in `e2e/` run against a running stack (for example the Docker stack); see
[e2e/README.md](e2e/README.md). They create their own test users and must not be run against
production.

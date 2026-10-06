# FlowDesk frontend

Next.js 16 (App Router), React 19, TypeScript and Tailwind frontend for FlowDesk. The API is
the Spring Boot backend in the [FlowDesk](https://github.com/JaiswalS2812/FlowDesk-) repository.

## How it talks to the backend

The browser calls `/api/*` on this server only. `next.config.ts` rewrites (proxies) those
requests to `BACKEND_API_URL` (default `http://localhost:8080`). The backend address is
therefore never exposed to the browser and no CORS setup is needed.

`BACKEND_API_URL` is read when the app is **built** (`next build` writes the rewrite into the
server's routes manifest), so set it before building; changing it requires a rebuild. It is
not a `NEXT_PUBLIC_` variable and does not appear in browser JavaScript.

### Client IP forwarding

The backend's login throttling counts failures per client IP and reads it from
`X-Forwarded-For` when the request comes from this server. The Next.js rewrite proxy passes
that header through unchanged and does not add the client's address, so the production server
runs with `forwarded-for.mjs` preloaded (`npm start` and the Docker image both do). It appends
the address of each incoming connection, like a standard reverse proxy, so a client cannot
choose the IP the backend sees. Run the production server through `npm start`, not plain
`next start`.

## Local development

```bash
npm install
echo BACKEND_API_URL=http://localhost:8080 > .env.local   # git-ignored
npm run dev
```

Open http://localhost:3000. The backend must be running (see the backend README).

Production build without Docker: `npm run build`, then `npm start`.

## Docker

The image is built and run by the Docker Compose stack in the backend repository
(`docker-compose.yml` there), which passes `BACKEND_API_URL=http://backend:8080` as a build
argument. See that repository's README for configuration, start/stop and health checks.

To build the image on its own:

```bash
docker build --build-arg BACKEND_API_URL=http://backend:8080 -t flowdesk-frontend .
```

The `Dockerfile` installs dependencies and runs `next build` with `NEXT_OUTPUT_STANDALONE=1`
(enables `output: "standalone"`), then copies only the standalone server and
`forwarded-for.mjs` into a `node:22-alpine` runtime image that runs as the non-root `node`
user on port 3000. Development dependencies, sources and `.env*` files
are not part of the runtime image.

## Security headers

`next.config.ts` sends a Content-Security-Policy and other security headers on every page.
`Strict-Transport-Security` must be added by the TLS-terminating proxy in front of the app.

## End-to-end tests

Playwright tests in `e2e/` run against a running stack (for example the Docker stack); see
[e2e/README.md](e2e/README.md).

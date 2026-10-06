# syntax=docker/dockerfile:1

# ---- Dependencies (including dev dependencies needed to build) ---------------------------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

# ---- Build -----------------------------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app

# The /api/* rewrite destination is fixed at build time (next.config.ts). It is a server-side
# value only: it ends up in the server's routes manifest, not in browser JavaScript.
ARG BACKEND_API_URL
ENV BACKEND_API_URL=${BACKEND_API_URL} \
    NEXT_OUTPUT_STANDALONE=1 \
    NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN test -n "$BACKEND_API_URL" || { echo "Build argument BACKEND_API_URL is required" >&2; exit 1; } \
    && npm run build

# ---- Runtime: standalone server only, no node_modules from the build, non-root -------------
FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Application files stay root-owned (read-only for the app); only the cache is writable
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/forwarded-for.mjs ./
RUN mkdir -p .next/cache && chown node:node .next/cache

USER node
EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
    CMD wget -q -O /dev/null http://127.0.0.1:3000/login || exit 1

# forwarded-for.mjs appends the connection's address to X-Forwarded-For before /api/* is
# proxied, so clients cannot choose the IP the backend's login throttling sees
CMD ["node", "--import", "./forwarded-for.mjs", "server.js"]

# End-to-end tests

Playwright tests that drive the real frontend and backend in a browser.

## What they need

- FlowDesk running: the Next.js server (default `http://localhost:3000`, or `E2E_BASE_URL`)
  and the backend behind it.
- An existing **ADMIN** account, passed as `E2E_ADMIN_EMAIL` and `E2E_ADMIN_PASSWORD`.
  It is only used to give the test users their roles.
- Google Chrome (used by default). Set `PW_CHANNEL=msedge` for Edge, or `PW_CHANNEL=` and
  run `npx playwright install chromium` for Playwright's own Chromium.

```bash
E2E_ADMIN_EMAIL=admin@example.com E2E_ADMIN_PASSWORD=... npm run test:e2e
```

## Test data

Each run registers six new users (`e2e-<role>-<run>@<E2E_EMAIL_DOMAIN>`, default domain
`e2e.local`) in a new department `E2E-<RUN>`, and creates one ticket with comments and
notifications. Credentials are kept in `e2e/.state/` (git-ignored). Existing users, tickets
and SLA policies are not modified; the SLA test only reads the policies.

The application has no user deletion, so remove the test data from the database after a run
on a shared environment (users with the e2e email domain and their tickets, comments,
notifications and audit entries). Do not run against production.

# admin-web

Internal admin panel for Nafaqati (React 19 + Vite, same stack as `nafaqati-web`). Runs on port **5175**.

```
npm install
npm run dev      # http://localhost:5175
npm test         # privacy utility tests
```

## Privacy rules (non-negotiable)

The panel shows **account metadata and aggregates only**. It never loads or displays a person's name, contact details,
transactions, balances, merchants, notes or any other financial/personal content.

Enforced in three layers:

1. **Contract:** admin endpoints must not return those fields (see below).
2. **Client guard:** `src/lib/privacy.js` `sanitize()` strips forbidden keys (`email`, `name`, `amount`, `balance`, `merchant`,
   `description`, `transactions`, ...) from every API response before any screen sees it, and warns in the console.
   Do not name a field `name`; use `service`, `title`, `label`, etc.
3. **Display rules:** accounts appear as a pseudonymous ref (`shortId`) and a masked email (`maskEmail`); aggregate groups
   under 5 are shown as `<5` (`suppressSmall`).

Sessions: access token in memory only, refresh token in `sessionStorage`, 15 minute idle sign-out, nothing in `localStorage`.

## Data source

`VITE_USE_MOCKS=true` (default) uses fixtures in `src/mocks/data.js`, because admin-service (port 8088) is not built yet.
The three request actions already exist in user-service:

- `POST /api/admin/email-change-requests/{id}/confirm`
- `POST /api/admin/deletion-requests/{id}/process | complete | cancel`

Endpoints the panel expects from admin-service (all `ROLE_ADMIN`, all privacy-safe responses), listed in `src/services/adminApi.js`:

| Endpoint | Returns |
|---|---|
| `GET /api/admin/stats/overview`, `/stats/billing` | aggregates and time series |
| `GET /api/admin/users`, `POST /users/{id}/status`, `/users/{id}/force-logout` | `id`, `emailMasked`, `status`, `plan`, `inFamily`, `authProvider`, dates |
| `GET /api/admin/email-change-requests`, `/deletion-requests` | request state with `userRef` and masked emails |
| `GET /api/admin/system/health`, `/system/kafka`, `/feature-flags` | service status, lag, flags |
| `GET/POST /api/admin/broadcasts` | segment-level announcements (no per-person targeting) |
| `GET /api/admin/audit` | append-only admin action log |

To go live: build admin-service, set `VITE_USE_MOCKS=false`, point `GATEWAY_URL` at the gateway.

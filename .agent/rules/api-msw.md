# API, React Query, and MSW

This is the single source of truth for client-side server-state boundaries.

## Layers

- `packages/core`: shared request, response, and domain types.
- `packages/api-client`: axios instance, endpoint constants, HTTP functions, and response conversion. It imports no React or TanStack Query.
- `apps/oop/src/features/<domain>/queries`: app-local Query/Mutation hooks.
- Components consume hooks; they do not call axios, `apiClient`, or HTTP functions directly.

HTTP function prefixes are `fetch` (GET), `submit` (POST), `update` (PUT/PATCH), and `remove` (DELETE). Export new shared types and API functions from their package entry points. UI side effects such as navigation, toast, caching, and invalidation stay in app hooks/components.

## React Query

```text
apps/oop/src/features/<domain>/queries/
  <domain>Keys.ts
  use<Thing>Query.ts
  use<Action>Mutation.ts
```

- Manage keys per domain and invalidate the narrowest relevant key after mutation success.
- When a query requires `sectionId`, `teamId`, `projectId`, `milestoneId`, or another prerequisite, block it with `enabled` until the identifier exists.
- Show a distinct missing-prerequisite UI state; do not present it as loading or a network error.
- Never invent an empty/default ID to make a request valid.
- Add a regression test that verifies the API is not called without a required identifier.

## MSW ownership

- Fixtures → `apps/oop/src/mocks/data`
- Handlers → `apps/oop/src/mocks/handlers`
- Browser worker setup → `apps/oop/src/mocks/browser.ts`, started only in development
- `mockServiceWorker.js` is generated; never hand-edit it.

A demo user is one coherent account across credentials, token, login, and `/me`. Do not branch UI behavior by fixture names/passwords or place mock switches/data in routes and components. Handlers must implement the same API-client contract.

## MSW security boundary

MSW verifies development request, response, and error contracts. It does not prove real HttpOnly cookie behavior, credentialed CORS, token rotation, backend RBAC, or section-scope authorization. Never put real credentials, tokens, student data, or production URLs in fixtures.

Verify at least one success scenario, one unauthorized/invalid scenario, and the consuming route/form. Keep `onUnhandledRequest: 'bypass'` intentional and investigate new unhandled requests.

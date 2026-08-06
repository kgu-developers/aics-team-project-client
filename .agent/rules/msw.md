# MSW development contract

## Ownership

- Development fixtures belong in `apps/oop/src/mocks/data`.
- MSW handlers belong in `apps/oop/src/mocks/handlers`.
- Browser worker setup belongs in `apps/oop/src/mocks/browser.ts`; app bootstrap starts it only in development.
- `mockServiceWorker.js` is generated output. Do not hand-edit it.

## Fixture rules

- A demo user is one coherent record: `user`, credentials, and access token.
- Login and `GET /me` must resolve the same account record.
- Do not create per-page role fixtures or branch UI behavior by fixture names/passwords.
- Do not put mock data or mock/real switches inside route or UI components.

## API boundary

- Shared request/response/domain types live in `@aics/core`.
- HTTP functions live in `@aics/api-client`.
- App-local TanStack Query hooks and mutations live under `apps/oop/src/features/<domain>/queries`.
- MSW responds to the same API function contract; it does not replace the API-client layer.

## Security boundary

- MSW validates development request, response, and error contracts only.
- It does not prove real HttpOnly cookie behavior, credentialed CORS, token rotation, server-side RBAC, or section-scope authorization.
- Never add real credentials, tokens, student data, or production URLs to fixtures.

## Verification

Verify one successful scenario, one unauthorized/invalid scenario, and the consuming route or form. Keep `onUnhandledRequest: 'bypass'` intentional; investigate a new unhandled request before relying on the screen result.

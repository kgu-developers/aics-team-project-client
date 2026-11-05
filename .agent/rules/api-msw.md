# API, React Query, and MSW

This is the single source of truth for client-side server-state boundaries.

## Layers

- `packages/core`: shared request, response, and domain types.
- `packages/api-client`: axios instance, endpoint constants, HTTP functions, and response conversion. It imports no React or TanStack Query.
- `apps/oop/src/features/<domain>/queries`: app-local Query/Mutation hooks.
- Components consume hooks; they do not call axios, `apiClient`, or HTTP functions directly.

HTTP function prefixes are `fetch` (GET), `submit` (POST), `update` (PUT/PATCH), and `remove` (DELETE). `save` is allowed for an explicit idempotent draft/save action even when it uses PUT; keep it distinct from a final `submit` action. Action-specific names such as `searchPartnerCandidates`, `requestPartner`, `respondToPartnerRequest`, `cancelPartnerRequest`, and `confirmTeamLeader` are also allowed when they make a domain operation clearer than a generic CRUD verb. Export new shared types and API functions from their package entry points. UI side effects such as navigation, toast, caching, and invalidation stay in app hooks/components.

## API client file granularity

- Each externally consumed HTTP operation gets one lowerCamelCase source file named exactly after its exported function. For example, `submitTeamAssignmentSurvey.ts` exports `submitTeamAssignmentSurvey()`.
- Group operations in their domain directory under `packages/api-client/src/<domain>/`; the directory `index.ts` only re-exports those operations, and the package root re-exports the domain boundary.
- Do not add several independent endpoint operations to one source file. Axios client setup, endpoint constants, and private shared mappers/helpers may remain separate when they are not operations.
- Apply the same one-file-per-exported-Hook rule in `apps/oop/src/features/<domain>/queries/`: `useSubmitTeamAssignmentSurveyMutation.ts` exports `useSubmitTeamAssignmentSurveyMutation()`. The query-directory `index.ts` re-exports those public Hooks and shared query-key helpers; consumers import from that barrel.

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
- Node HTTP test servers → `setupServer` in automated tests only; no browser worker or MSW application mode.

Synthetic credentials, authentication responses and `/me` must describe one coherent account. Application UI, Hooks, API functions, mappers and prerequisite/permission checks use one path regardless of response provider. Do not add mock flags, preview headers, fixture-based branches or user enrichment to application code.

Handlers return the server wire format before API-client mapping: methods, paths, identifiers, body/content type, status and response schema follow the current OpenAPI and pinned server evidence. Domain/UI objects belong after mapping, not in HTTP fixtures. Keep nullable/documentation conflicts explicit rather than inventing values.

Use per-instance handler state for new scenarios and reset mutable fixture/auth state between tests. Do not enable browser-storage persistence for ordinary automated tests. Retire mock-only operations when their UI is removed; an endpoint without a documented server equivalent and with an existing UI consumer needs an explicit backend/product decision.

## MSW security boundary

MSW verifies test request, response, and error contracts. It does not prove real HttpOnly cookie behavior, credentialed CORS, token rotation, backend RBAC, or section-scope authorization. Never put real credentials, tokens, student data, or production URLs in fixtures.

Verify at least one success scenario, one unauthorized/invalid scenario, and the consuming route/form. Use `onUnhandledRequest: 'error'` for test HTTP boundaries; never silently send an unhandled test request to a real backend.

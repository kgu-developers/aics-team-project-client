# API conventions

Keep HTTP calls, shared types, and React Query hooks in separate layers.

## Layer boundaries

- `packages/api-client`: axios-based API functions only. Do not import React or TanStack Query here.
- `packages/core`: shared request/response/domain types.
- `apps/*`: React Query hooks and UI composition.

Components must not call axios, `apiClient`, or API functions directly. Components should use app-local Query Hooks.

## API functions

Use `packages/api-client` for API functions. HTTP function prefixes:

- GET: `fetch`
- POST: `submit`
- DELETE: `remove`
- PUT/PATCH: `update`

Use axios as the HTTP client through `apiClient` only:

```ts
import { apiClient } from '../client';
```

Prefer request/response/domain types from `@aics/core`. If a shared API type is missing, add it to `packages/core/src/<domain>/` before using it in `packages/api-client`.

Export every new API function from `packages/api-client/src/index.ts`.

## React Query

React Query hooks live inside each app, grouped by feature/domain:

```text
apps/oop/src/features/<domain>/queries/
  <domain>Keys.ts
  use<Thing>Query.ts
  use<Action>Mutation.ts
```

Query keys are managed per domain. Query hooks may import API functions from `@aics/api-client`; API functions must not import query hooks.

Mutation hooks should invalidate the narrowest relevant domain key after a successful mutation.

## Side effects

API functions handle HTTP request/response conversion only. Caching, invalidation, toast messages, navigation, and other UI side effects belong in app-level hooks or components.

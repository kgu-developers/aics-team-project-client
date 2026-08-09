# Routing and authentication

## Route ownership

- TanStack file routes live in `apps/oop/src/app/routes`.
- A route file owns route declaration, route-level redirect/guard wiring, shell selection, and page-level composition only.
- Keep API calls, MSW fixtures, complex form state, and domain actions out of route files; place them according to `product-structure.md`.
- `apps/oop/src/app/routeTree.gen.ts` is generated. Never edit it by hand. Add/remove the route source and run `pnpm --filter @aics/oop build` to regenerate it.

## Current login contract

- `submitLogin()` obtains the access token; the auth mutation then calls `fetchCurrentUser()`.
- Route after login only from server-confirmed `CurrentUser.globalRole`, never from a student number, password, fixture name, or UI-only role value.
- Current destinations: `STUDENT` → `/student`; `ASSISTANT` and `PROFESSOR` → `/admin`.
- Keep access tokens in the configured auth-store boundary. Do not add localStorage persistence as a shortcut.

## Current security limit

- Post-login navigation is UX, not authorization.
- The current app does not yet provide complete direct-route role guards or backend RBAC/section-scope authorization.
- Do not claim `/admin` is protected merely because a user was redirected elsewhere after login.
- URL hiding or renaming is not a security control.
- A future authorization ticket must add explicit route guards, backend `403` contracts, and section-scope checks. It must also restore the current user before choosing a role home after refresh.

## Verification

For a route/auth change, verify route-tree regeneration, student login → `/student`, operator login → `/admin`, invalid login behavior, and browser console errors. Use MSW only for development-contract verification; it is not proof of backend cookie or RBAC behavior.

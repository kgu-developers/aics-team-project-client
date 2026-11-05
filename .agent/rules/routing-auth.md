# Routing and authentication

## Route ownership

- TanStack file routes live in `apps/oop/src/app/routes`.
- A route file owns route declaration, route-level redirect/guard wiring, shell selection, and page-level composition only.
- Keep API calls, MSW fixtures, complex form state, and domain actions out of route files; place them according to `product-structure.md`.
- `apps/oop/src/app/routeTree.gen.ts` is generated. Never edit it by hand. Add/remove the route source and run `pnpm --filter @aics/oop build` to regenerate it.

## Current login contract

- `submitLogin()` returns the session role while the server issues HttpOnly authentication cookies; the auth mutation resolves `/users/me` through `fetchSessionUser()`.
- Login/refresh wire roles are `ADMIN | STUDENT | ASSISTANT`; `/users/me.globalRole` is `ADMIN | USER`. Preserve the session role when deriving the app role, and reject inconsistent combinations. Never rebuild server identity from demo fixtures.
- Route after login only from server-confirmed `CurrentUser.globalRole`, never from a student number, password, fixture name, or UI-only role value.
- Current destinations: `STUDENT` → `/student`; `ASSISTANT` and `PROFESSOR` → `/admin`.
- Keep access tokens in the configured auth-store boundary. Do not add localStorage persistence as a shortcut.

## Current security limit

- Post-login navigation is UX, not authorization.
- The current app does not yet provide complete direct-route role guards or backend RBAC/section-scope authorization.
- Do not claim `/admin` is protected merely because a user was redirected elsewhere after login.
- URL hiding or renaming is not a security control.
- Session restoration already refreshes the session and reads `/me` before rendering. StudentShell checks session, role and student/team prerequisites. These client checks do not establish complete backend `403` or section-scope authorization; do not describe the remaining security work as if no session restoration exists.

## Verification

For a route/auth change, verify route-tree regeneration, student login → `/student`, operator login → `/admin`, invalid login behavior, and browser console errors. Use MSW only in automated contract tests; it is not proof of backend cookie or RBAC behavior.

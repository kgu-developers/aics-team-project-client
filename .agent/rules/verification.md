# Verification

Baseline handoff commands:

```bash
pnpm lint
pnpm build
```

Add tests/typecheck when scripts exist or the change warrants it.

## Route, authentication, and MSW changes

- Run `pnpm --filter @aics/oop build` after adding or removing a file route so TanStack regenerates `routeTree.gen.ts`.
- Verify one successful and one failure/unauthorized flow for an auth or MSW contract change.
- For role routing, verify student → `/student` and operator → `/admin` in a browser.
- Inspect browser console errors for a changed user flow.

## Design-system and UI changes

- Run `pnpm --filter @aics/design-system build` after editing the package.
- Run a consuming OOP build after a runtime export, CSS, provider, or theme change.
- Inspect at least one live consuming route for UI/theme work; type declarations alone are insufficient.
- Confirm app code did not add a direct `@astryxdesign/*` import or a duplicate local primitive.

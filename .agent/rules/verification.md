# Verification

Baseline handoff commands:

```bash
pnpm lint
pnpm build
```

Add tests/typecheck when scripts exist or the change warrants it.

Test-authoring rules live in `testing.md`; API/MSW scenario boundaries live in `api-msw.md`. Report passed, failed, skipped, and unverified checks separately. Evidence must come from real command or browser output.

## Route, authentication, and MSW changes

- Run `pnpm --filter @aics/oop build` after adding or removing a file route so TanStack regenerates `routeTree.gen.ts`.
- Verify one successful and one failure/unauthorized flow for an auth or MSW contract change.
- For role routing, verify student → `/student` and operator → `/admin` in a browser.
- Inspect browser console errors for a changed user flow.

## Design-system and UI changes

- Run `pnpm --filter @aics/design-system build` after editing the package.
- Run a consuming OOP build after a runtime export, CSS, provider, or theme change.
- Inspect at least one live route in the consuming app for UI/theme work; type declarations alone are insufficient.
- Confirm app code did not add a direct `@astryxdesign/*` import or a duplicate local primitive.

## Private-source safety

- Run `.agent/scripts/check-local-files.mjs` and `.agent/scripts/check-diff-hygiene.mjs` when local PRD sources/caches or other private artifacts were used.
- Confirm no PRD URL, downloaded workbook, credential, or private content appears in the diff.

## Selecting MSW and UI verification

- `pnpm --filter @aics/oop test:logic` selects logic/HTTP suites; `test:ui` selects component/Hook suites. `test` runs both. Browser-dependent TS suites may explicitly select jsdom.
- Use the same application UI and API functions in component/contract checks. A retired demo page or transformed UI fixture is not proof of a current server response contract.
- Choose affected functional/contract checks first; use targeted UI checks or human review for consuming screens. Do not implicitly run an entire live-server write workflow for a small handler change.
- Run `pnpm agent:check-msw` after app/API changes to prevent production imports of test mocks or obsolete mock switches/preview headers.
- For contract alignment, distinguish declared handlers, default test composition and test overrides. Record which request/response/error cases were actually inspected.

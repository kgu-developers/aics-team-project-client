# Test code

Use the smallest test layer that proves user-visible behavior or a risky contract. Tests should survive internal refactors.

## Placement and naming

- Co-locate tests with the source as `*.test.ts` or `*.test.tsx` unless an existing feature test folder establishes a clearer pattern.
- Keep shared test setup under the consuming app, such as `apps/oop/src/test/`.
- Name tests by observable condition and outcome, not implementation method.

## What to test

- Pure transformations and boundary logic → unit test.
- Component states and interactions → Testing Library component test.
- Query/API contract with realistic request behavior → Query hook or component test backed by MSW.
- Route/role flow or browser-only behavior → browser/E2E verification when available.
- A bug fix should include a regression test when the failure is deterministic and the test is proportionate to the risk.

## Testing Library

- Prefer queries by role, accessible name, label, and visible text.
- Use `data-testid` only when no stable user-facing selector exists.
- Assert observable behavior; avoid component internals, CSS implementation details, hook call order, or private state.
- Exercise meaningful success, empty, error, disabled/prerequisite, and keyboard states where relevant.

## Isolation

- Give tests an isolated QueryClient with retries disabled unless retry behavior is under test; clear it after each test.
- Reset MSW handlers after each test and close the server after the suite.
- Override handlers per test for scenario-specific responses; do not mutate shared fixtures across tests.
- Prefer real timers. Use fake timers only for time-dependent behavior and restore them after each test.
- Avoid snapshots for behavioral UI. Use narrow snapshots only for stable serialized output where they improve reviewability.

## Reliability

- Await user events and asynchronous UI transitions.
- Do not use arbitrary sleeps or depend on test execution order.
- A test that cannot reliably distinguish the regression from a passing implementation should not be added as evidence.

## Execution cost and environments

- OOP logic/HTTP suites (`*.test.ts`) default to Node. DOM/React assertion setup loads only when a browser environment exists.
- OOP component/Hook suites (`*.test.tsx`) use jsdom. A `.test.ts` suite with genuine DOM/cookie/storage dependencies must declare `@vitest-environment jsdom`.
- Preserve high-risk functional behavior, contract checks and missing-identifier regressions. Consolidate duplicate render-heavy checks; do not replace all automated checks with live-server E2E or remove every UI test.
- Keep file isolation enabled. Validate bounded parallelism against the whole suite before increasing workers; never turn isolation off globally to obtain a faster number.
- Report setup/environment/import time separately from test-body time when optimizing execution. Compare equivalent cases and mark incomplete full-suite measurements.
- Real-server E2E is a separate explicitly selected scope requiring accounts and prepared data. Mocked automatic tests require no real server or credentials.

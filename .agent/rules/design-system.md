# Design system

`@aics/design-system` is the AICS integration boundary for the real Astryx design system. It is not a local replacement component library.

## Use it from apps

- In `apps/*`, import visual primitives and the theme provider only from `@aics/design-system`.
- Do not import `@astryxdesign/*` directly from an app.
- Keep `@aics/design-system/styles.css` imported once from the app global stylesheet before app-specific rules.
- Use the exported Astryx primitives before writing markup and CSS: `Button`, `Badge`, `Card`, `EmptyState`, `HStack`, `VStack`, `Text`, `Heading`, `TextInput`, and `TextArea`.
- Keep OOP-specific page composition, shell layout, and responsive placement in `apps/oop`. Do not create OOP-specific visual wrappers in the design-system package.

## Styling boundary

- Use Astryx semantic tokens such as `--color-*`, `--spacing-*`, and `--radius-*` for app layout CSS.
- Do not introduce an app-local color scale, spacing scale, `ds-*` token system, or look-alike `Button`/`Input`/`Card` primitives.
- Literal layout values are acceptable when they describe geometry rather than a design token: content width, shell height, grid columns, breakpoints, and a one-off component alignment.
- Prefer component props and semantic tokens over component-specific color, typography, border, or state overrides.
- Preserve semantic HTML, visible focus behavior, labels, error messages, and loading/empty/error states. Astryx primitives do not remove page-level accessibility responsibility.

## When the current inventory is insufficient

1. Check `packages/design-system/src/index.ts` and the installed Astryx API before adding anything.
2. If Astryx already provides the primitive, re-export its real contract through `@aics/design-system`; do not clone its markup or styles locally.
3. If the requested UI is OOP-domain-specific, keep the composition in `apps/oop`.
4. Add an AICS-level component only after a real second app/use case or an explicit shared-package ticket.
5. Theme changes belong in `packages/design-system/src/theme/oopTheme.ts`; they must be backed by an approved design decision, not a page-local preference.

## Package boundary

- `packages/design-system` owns Astryx dependency versions, reset/core CSS import order, the OOP theme definition, provider, and audited re-exports.
- `packages/ui` remains the place for any generic AICS-owned UI only when it does not duplicate Astryx.
- `packages/team-project-kit` owns reusable course-operation templates after a verified second course use case.
- Read `packages/design-system/AGENTS.md` before editing the design-system package itself.

## Verification

For UI work, run the relevant typecheck/lint/build and inspect a live route. For design-system package changes, also run `pnpm --filter @aics/design-system build` and confirm a consuming OOP route still renders with the Astryx theme.

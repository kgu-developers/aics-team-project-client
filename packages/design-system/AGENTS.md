# `@aics/design-system` agent guide

This package is the AICS integration boundary for the real Astryx design system. Preserve Astryx contracts rather than rebuilding a local design system that merely looks similar.

## What this package owns

```text
src/styles.css                    Astryx reset/core CSS import order
src/theme/oopTheme.ts             approved OOP theme-level overrides
src/provider/AstryxThemeProvider  Theme wiring for consuming apps
src/index.ts                      audited public re-exports
```

The current runtime is `@astryxdesign/core@0.2.0`. The package exports real Astryx `Badge`, `Button`, `Card`, `EmptyState`, `HStack`, `VStack`, `Text`, `Heading`, `TextInput`, and `TextArea`, plus `AstryxThemeProvider` and `oopTheme`.

## Non-negotiable rules

- Do not create local look-alike primitives for an existing Astryx component.
- Do not copy Astryx DOM, CSS, keyboard handling, or accessibility behavior into AICS code.
- Do not add app/domain components such as TeamCard, MilestoneTable, SubmissionStatus, or admin dashboard blocks here. Those belong in `apps/oop` until a verified second course use case supports promotion.
- Do not add a parallel color scale, spacing scale, or local `ds-*` token system.
- Do not import the package's internal source paths from consuming apps. Apps use `@aics/design-system` and `@aics/design-system/styles.css` only.
- Do not edit generated `dist/` files.

## How to make a change

1. Inspect the installed Astryx component API and `src/index.ts` first.
2. If Astryx provides the capability, add a narrow re-export with its original name and props/types when needed.
3. If the request is an OOP-only composition, implement it in `apps/oop` using existing exports and semantic tokens.
4. Change `oopTheme.ts` only for an approved theme-level design decision. Keep the override minimal; do not copy the complete Astryx token set.
5. Keep font delivery in the consuming app/deployment. The theme records font family intent, not font files.
6. Update the agent/design-system documentation when the public inventory or boundary changes.

## Styling and accessibility

- `src/styles.css` must preserve Astryx reset before core CSS.
- Let Astryx own primitive interaction and semantic styling; app CSS may own layout and composition using Astryx semantic tokens.
- Check accessible foreground/background contrast when changing `--color-accent` or `--color-on-accent`.
- Preserve labels, descriptions, errors, focus behavior, and loading/empty/error states at the consuming page level.

## Verification

```bash
pnpm --filter @aics/design-system lint
pnpm --filter @aics/design-system build
pnpm --filter @aics/oop build
```

For a runtime/theme/export change, render a consuming OOP route and inspect that it still sits under `AstryxThemeProvider`. Do not report an Astryx integration change as complete from type declarations alone.

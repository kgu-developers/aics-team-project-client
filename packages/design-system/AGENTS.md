# `@aics/design-system` agent guide

This package is the AICS integration boundary for the real Astryx design system. Preserve Astryx contracts rather than rebuilding a local design system that merely looks similar.

## What this package owns

```text
src/styles.css                    Astryx reset/core CSS import order
src/theme/oopTheme.ts             approved OOP theme-level overrides
src/provider/AstryxThemeProvider  Theme wiring for consuming apps
src/tokens.ts                     typed Astryx semantic token contract (createGlobalThemeContract)
src/index.ts                      audited public re-exports
```

The current runtime is `@astryxdesign/core@0.2.0`. The package exports real Astryx `Avatar`, `Badge`, `Breadcrumbs`, `BreadcrumbItem`, `Button`, `Card`, `Carousel`, `CheckboxList`, `CheckboxListItem`, `Collapsible`, `CollapsibleGroup`, `Dialog`, `Divider`, `EmptyState`, `Field`, `FileInput`, `IconButton`, `MetadataList`, `MetadataListItem`, `Popover`, `RadioList`, `RadioListItem`, `StatusDot`, `Tooltip`, `HStack`, `VStack`, `Text`, `Heading`, `Tab`, `TabList`, `TextInput`, `TextArea`, `Table`, `ToastViewport`, and `useToast`, plus `AstryxThemeProvider`, `oopTheme`, and `tokens`.

`tokens` is a typed reference over Astryx CSS variables (Figma collection 01-05, 133 variables, plus `color.border.base` which exists in Astryx but not the Figma export). It emits no CSS and declares no values — Astryx supplies them at runtime. It is not a parallel token system; do not add values or new names to it unless they exist in Astryx. OOP-only layout tokens (Figma collection 06) live in `apps/oop/src/app/tokens.css.ts`, not here.

The installed component inventory lives in `.agent/rules/astryx-inventory.md`; selection/re-export policy lives in `.agent/rules/design-system.md`. Read both before adding a visual or interactive primitive. A component missing from `src/index.ts` is not evidence that Astryx lacks it.

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
- Consuming apps style with vanilla-extract `*.css.ts` (one co-located file per component); this package itself stays plain CSS imports. See `.agent/rules/design-system.md`.
- Check accessible foreground/background contrast when changing `--color-accent` or `--color-on-accent`.
- Preserve labels, descriptions, errors, focus behavior, and loading/empty/error states at the consuming page level.

## Verification

```bash
pnpm --filter @aics/design-system lint
pnpm --filter @aics/design-system build
pnpm --filter @aics/oop build
```

For a runtime/theme/export change, render a consuming OOP route and inspect that it still sits under `AstryxThemeProvider`. Do not report an Astryx integration change as complete from type declarations alone.

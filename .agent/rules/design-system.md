# Design system

`@aics/design-system` is the AICS integration boundary for the real Astryx design system. It is not a local replacement component library.

## Use it from apps

- For every UI task, read `.agent/rules/astryx-inventory.md` and map the requested UI to the installed Astryx inventory before writing markup or CSS.
- In `apps/*`, import visual primitives and the theme provider only from `@aics/design-system`.
- Do not import `@astryxdesign/*` directly from an app.
- Keep `@aics/design-system/styles.css` imported once from the app global stylesheet before app-specific rules.
- Use the exported Astryx primitives before writing markup and CSS: `Avatar`, `Badge`, `Button`, `Card`, `Divider`, `EmptyState`, `HStack`, `IconButton`, `VStack`, `Text`, `Heading`, `TextInput`, and `TextArea`.
- Keep OOP-specific page composition, shell layout, and responsive placement in `apps/oop`. Do not create OOP-specific visual wrappers in the design-system package.

## Styling approach: vanilla-extract

Apps style with vanilla-extract (`@vanilla-extract/css`), not with a monolithic global CSS file.

- Co-locate one `*.css.ts` per component — e.g. `StudentShell.css.ts` next to `StudentShell.tsx` — and export named styles. Each component imports only its own styles file.
- `globals.css` is only an import hub: `@aics/design-system/styles.css` first, then `@fontsource` imports. Global resets (`:root`, `*`, `body`) live in an app-level `global.css.ts` via `globalStyle`.
- Use Astryx semantic tokens (`var(--color-*)`, `var(--spacing-*)`, `var(--radius-*)`, `var(--font-family-*)`) inside `*.css.ts`.
- Do not introduce an app-local color scale, spacing scale, `ds-*` token system, or look-alike `Button`/`Input`/`Card` primitives.
- Literal values are acceptable only when they describe geometry rather than a design token: content width, shell height, grid columns, breakpoints, and a one-off component alignment.
- Prefer component props and semantic tokens over component-specific color, typography, border, or state overrides.
- Conditional classes compose with a tiny `cx` helper (e.g. `apps/oop/src/shared/lib/cx.ts`). Do not import `cx` from `@vanilla-extract/css`; it is no longer exported.
- `style()` forbids descendant selectors. Use `globalStyle()` for element descendants (`${parent} h1`) and Astryx-internal overrides (`${milestone} .astryx-collapsible-trigger`), or write `${parent} &` inside the child's own style.
- Responsive rules use the nested `'@media'` key inside `style()`.
- Variant classes stay as separate exported styles (e.g. `dotBefore` / `dotCompleted`) chosen in the component, or use `styleVariants` when the variant set is stable.
- Preserve semantic HTML, visible focus behavior, labels, error messages, and loading/empty/error states. Astryx primitives do not remove page-level accessibility responsibility.

### Figma design tokens

Figma "OOP 디자인 토큰" 변수는 코드 안에서 두 경로로 사용한다:

- 컬렉션 01–05 (고유 변수 133개: spacing, size, border, radius, color Light/Dark, duration, ease, typography)는 Astryx가 동일한 이름·값으로 런타임 제공한다. `packages/design-system/src/tokens.ts`의 `tokens` contract(`createGlobalThemeContract`)가 타입세이프한 `var(--color-*)`/`var(--spacing-*)` 참조를 준다. 값을 복사해 새 로컬 토큰 체계를 만들지 않는다.
- 컬렉션 06 (Desktop 레이아웃 17개: page, milestone, table, layout, hero, calendar, footer, workspace)은 Astryx에 없는 OOP 전용 토큰이며 `apps/oop/src/app/tokens.css.ts`의 `layoutTokens` contract + `createGlobalTheme`으로 `:root`에 선언한다.
- 원본 Figma export JSON은 레포 밖(`/Users/seojing/.hermes/okejing/assets/oop-design-tokens/`)에 보관한다.
- 새 hex가 필요하면 아래 hex 규칙을 따른다.

### Hex handling

Prefer a token over a literal. Hex is acceptable when it has no token mapping and is required for the design, and literal geometry values (content width, shell height, grid columns, breakpoints, one-off alignment) are fine as-is.

When a leftover hex maps to an Astryx token, prefer the approved substitutions below (decided 2026-08-07; approximate values were accepted as design decisions):

- `#ffffff` → `var(--color-background-card)` (on-card surfaces) or `var(--color-on-accent)` (text on accent)
- `#f1f4f7` → `var(--color-background-body)` (page-level hero/shell background)
- `#f3f6f7` → `var(--color-background-muted)` (muted panels, feedback boxes)
- `#dfe2e5`, `#e6ebee` (background) → `var(--color-background-gray)` (inactive tabs, light badges)
- `#e6ebee`, `#dbe3e8` (border) → `var(--color-border)` / `var(--color-border-emphasized)`
- `#0a1317` → `var(--color-text-primary)` (text) or `var(--color-icon-primary)` (icons)
- `#1c1c1f`, `#222222`, `#132d44` → `var(--color-text-primary)` (heading/body text)
- `#4e606f`, `#6b737a` → `var(--color-text-secondary)`
- `#999999`, `#aaafb5`, `#a4b0bc` → `var(--color-text-disabled)`
- `#6f747c` → `var(--color-icon-disabled)`
- `#0064e0` → `var(--color-text-accent)` (text) / `var(--color-accent)` (background) / `var(--color-icon-accent)` (icons)
- `#006ae4` → `var(--color-accent)`
- `#cce6fe` → `var(--color-background-blue)` (selected/voted tint)
- `#14a05a` → `var(--color-success)` (status dots)
- `#0a1317` on `--color-on-warning` contexts → keep semantic tokens, not hex

When a leftover hex has an approved mapping above, prefer the token. Using the mapped hex anyway is allowed when a design reason requires it — note the exception in the code comment so the next change can revisit the token.

## When the current inventory is insufficient

1. Check `.agent/rules/astryx-inventory.md` and `packages/design-system/src/index.ts` before adding anything.
2. If the component is installed but not yet re-exported, inspect its installed `.d.ts` contract and add only the required component and prop/type exports through `@aics/design-system`.
3. Update the documented public inventory whenever a re-export changes.
4. Do not fall back to native interactive markup, another UI library, or a look-alike implementation without first completing this check.
5. If the requested UI is OOP-domain-specific, keep the composition in `apps/oop` while composing Astryx primitives.
6. Add an AICS-level component only after a real second app/use case or an explicit shared-package ticket.
7. Theme changes belong in `packages/design-system/src/theme/oopTheme.ts`; they must be backed by an approved design decision, not a page-local preference.

## Package boundary

- `packages/design-system` owns Astryx dependency versions, reset/core CSS import order, the OOP theme definition, provider, and audited re-exports.
- A new shared component/template package requires a verified second course-app use case or an explicit extraction ticket; its name and boundary are decided by that work.
- Read `packages/design-system/AGENTS.md` before editing the design-system package itself.

## Verification

For UI work, run the relevant typecheck/lint/build — the app build compiles `*.css.ts` and fails on invalid vanilla-extract selectors — and inspect a live route. For design-system package changes, also run `pnpm --filter @aics/design-system build` and confirm a consuming OOP route still renders with the Astryx theme.

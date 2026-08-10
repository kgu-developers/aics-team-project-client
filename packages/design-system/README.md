# @aics/design-system

AICS/OOP의 Astryx integration boundary다. 이 패키지는 독자적인 디자인 시스템이나 OOP 화면 컴포넌트 모음이 아니다. Astryx의 실제 component, token, accessibility contract를 한곳에서 안전하게 소비하도록 한다.

코딩 에이전트는 패키지를 수정하기 전에 [`AGENTS.md`](./AGENTS.md)를 읽는다.

## Current runtime contract

- Runtime: `@astryxdesign/core@0.2.0`
- `src/styles.css`: Astryx reset을 먼저, core CSS를 다음에 import한다.
- `src/theme/oopTheme.ts`: Astryx semantic token contract를 유지하며 OOP 승인 theme override만 둔다.
- `src/provider/AstryxThemeProvider.tsx`: consuming app의 theme wiring을 담당한다.
- `src/tokens.ts`: Astryx semantic token에 대한 typed contract (Figma 컬렉션 01-05, 133개 + Astryx-only `color.border.base`). CSS를 emit하지 않고 접근 시 `var(--...)` 문자열을 반환한다.
- `src/index.ts`: 앱이 사용할 audited Astryx re-export를 제공한다.

현재 export inventory:

```text
Avatar, Badge, Button, Card, Collapsible, CollapsibleGroup, Divider
EmptyState, IconButton, StatusDot
HStack, VStack
Text, Heading
TextInput, TextArea
AstryxThemeProvider, oopTheme
tokens
```

## Use from an app

```tsx
import { Button, Card, Heading, tokens } from '@aics/design-system';
import '@aics/design-system/styles.css';
```

`tokens`는 Astryx가 런타임에 공급하는 CSS 변수명에 대한 타입세이프 참조다. 값은 정의하지 않으므로 Astryx 스타일시트가 로드되어야 한다. OOP 전용 레이아웃 토큰(Figma 컬렉션 06)은 `apps/oop/src/app/tokens.css.ts`에 있다.

앱은 `@astryxdesign/*` 또는 이 패키지의 `src/*` 내부 경로를 직접 import하지 않는다. `styles.css`는 앱 global stylesheet에서 한 번만 import한다.

## Boundary

- OOP 전용 Team, Milestone, Submission, Review, admin 화면 조합은 `apps/oop`에 둔다.
- 실제 두 번째 강의 앱 사용처가 확인되기 전에는 재사용 course-operation template package를 만들지 않는다. 검증된 두 번째 사용처가 생긴 뒤에만 필요한 composition을 별도 shared package로 추출한다.
- Astryx와 중복되지 않는 범용 AICS-owned UI가 실제 두 번째 소비처를 확보한 경우에만 별도 shared UI package 추출을 검토한다.
- Astryx component styling·DOM·keyboard/accessibility behavior를 로컬 구현으로 복제하지 않는다.

## Verification

```bash
pnpm --filter @aics/design-system lint
pnpm --filter @aics/design-system build
pnpm --filter @aics/oop build
```

Theme, export, CSS 변경은 OOP 소비 route에서 실제 렌더링까지 확인한다.

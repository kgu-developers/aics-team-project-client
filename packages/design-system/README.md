# @aics/design-system

AICS/OOP의 Astryx integration boundary다. 이 패키지는 독자적인 디자인 시스템이나 OOP 화면 컴포넌트 모음이 아니다. Astryx의 실제 component, token, accessibility contract를 한곳에서 안전하게 소비하도록 한다.

코딩 에이전트는 패키지를 수정하기 전에 [`AGENTS.md`](./AGENTS.md)를 읽는다.

## Current runtime contract

- Runtime: `@astryxdesign/core@0.2.0`
- `src/styles.css`: Astryx reset을 먼저, core CSS를 다음에 import한다.
- `src/theme/oopTheme.ts`: Astryx semantic token contract를 유지하며 OOP 승인 theme override만 둔다.
- `src/provider/AstryxThemeProvider.tsx`: consuming app의 theme wiring을 담당한다.
- `src/index.ts`: 앱이 사용할 audited Astryx re-export를 제공한다.

현재 export inventory:

```text
Badge, Button, Card, EmptyState
HStack, VStack
Text, Heading
TextInput, TextArea
AstryxThemeProvider, oopTheme
```

## Use from an app

```tsx
import { Button, Card, Heading } from '@aics/design-system';
import '@aics/design-system/styles.css';
```

앱은 `@astryxdesign/*` 또는 이 패키지의 `src/*` 내부 경로를 직접 import하지 않는다. `styles.css`는 앱 global stylesheet에서 한 번만 import한다.

## Boundary

- OOP 전용 Team, Milestone, Submission, Review, admin 화면 조합은 `apps/oop`에 둔다.
- 실제 두 번째 강의 앱 사용처나 명시적 shared-package ticket이 생긴 뒤에만 재사용 course-operation template을 `@aics/team-project-kit`으로 올린다.
- Astryx와 중복되지 않는 범용 AICS-owned UI만 `packages/ui` 후보가 될 수 있다.
- Astryx component styling·DOM·keyboard/accessibility behavior를 로컬 구현으로 복제하지 않는다.

## Verification

```bash
pnpm --filter @aics/design-system lint
pnpm --filter @aics/design-system build
pnpm --filter @aics/oop build
```

Theme, export, CSS 변경은 OOP 소비 route에서 실제 렌더링까지 확인한다.

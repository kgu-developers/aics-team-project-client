# Astryx primitive inventory

이 폴더는 local primitive 구현 위치가 아니다. 실제 primitive는 `@astryxdesign/core`에 있고, AICS는 `packages/design-system/src/index.ts`에서 필요한 계약만 re-export한다.

현재 app 사용 가능 inventory:

```text
Avatar, Badge, Button, Card, Collapsible, CollapsibleGroup, Divider
EmptyState, IconButton
HStack, VStack
Text, Heading
TextInput, TextArea
```

새 UI가 필요하면 먼저 Astryx API와 `src/index.ts`를 확인한다. Astryx에 있으면 같은 이름과 props/type contract로 얇게 re-export한다. OOP 도메인 조합이면 `apps/oop`에 둔다. 기존 Astryx primitive의 look-alike 구현은 추가하지 않는다.

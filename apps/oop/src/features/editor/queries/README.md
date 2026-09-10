# 공통 잠금 Query / Mutation

제안서·중간보고서·회의록의 실제 서버 `/edit-locks` 계약을 사용한다.
소비 화면에서는 `~/features/editor/queries`에서 가져온다.

```tsx
import type { LiveEditLockTarget } from '@aics/core';
import {
  useLiveEditLockQuery,
  useAcquireLiveEditLockMutation,
  useReleaseLiveEditLockMutation,
} from '~/features/editor/queries';

// 실제 조회 응답에서 얻은 숫자 ID와 그 문서의 영역 키를 전달한다.
const target: LiveEditLockTarget | null = project
  ? { targetType: 'PROJECT', targetId: project.id, sectionKey }
  : null;

const lockQuery = useLiveEditLockQuery(target);
const acquireLock = useAcquireLiveEditLockMutation();
const releaseLock = useReleaseLiveEditLockMutation();
const lockPending = acquireLock.isPending || releaseLock.isPending;

async function startEditing() {
  if (!target || lockPending) return;
  try {
    const status = await acquireLock.mutateAsync(target);
    // status.locked / lockedBy로 서버의 계정 소유 상태를 확인한다.
    // 409는 catch로 전달되고 lockQuery에는 재조회한 편집자 정보가 반영된다.
  } catch (error) {
    // 폼/알림 정책에 맞춰 획득 오류를 표시한다.
  }
}

async function finishEditing() {
  if (!target || lockPending) return;
  // 필요한 저장이 성공한 뒤 명시적으로 호출한다.
  // 실패는 호출자가 처리하며, 204 뒤 활성 lockQuery는 자동으로 재조회된다.
  await releaseLock.mutateAsync(target);
}
```

## 문서별 대상

| 화면            | targetType         | targetId                         | sectionKey                   |
| --------------- | ------------------ | -------------------------------- | ---------------------------- |
| 제안서          | `PROJECT`          | 서버가 반환한 `project.id`       | 해당 제안서 영역의 합의된 키 |
| 중간보고서 영역 | `MID_REPORT_BLOCK` | 서버가 반환한 `midReport.id`     | 해당 블록의 합의된 키        |
| 회의록          | `MEETING_RECORD`   | 서버가 반환한 `meetingRecord.id` | 해당 회의록 영역의 합의된 키 |

`sectionKey`는 문서 내부 영역이다. 수업 분반의 `sectionId`가 아니며 훅이 기본값을 만들지 않는다.
필수 데이터가 없으면 조회에 `null`을 전달하고 별도의 미준비 상태를 표시한다. 잘못된 ID나 빈 영역 키는 mutation에서도 요청 전에 거절된다.

서버는 `MID_REPORT`도 허용하지만 `MID_REPORT_BLOCK`과 **다른 잠금 저장 키**다.
중간보고서 영역 소비 코드는 기존 영역 편집 명칭에 맞춰 `MID_REPORT_BLOCK`으로 통일한다.
같은 영역에 두 targetType을 섞지 않는다. API 경계는 두 값을 임의 변환하지 않는다.

## 캐시와 오류

- 조회 캐시는 로그인 세션·대상 종류·문서 ID·영역 키로 구분한다. `liveEditLockKeys`도 barrel에서 공개한다.
- 획득 POST는 잠금 생성과 같은 계정의 갱신에 공통으로 사용한다. 반환 상태를 정확한 조회 캐시에 반영한다.
- 409는 mutation 오류로 유지한다. 응답에 소유자가 없으므로 GET으로 조회 캐시를 갱신한다. 재조회마저 실패하면 기존 캐시를 stale로 표시한다.
- 해제 DELETE의 204에는 본문이 없다. 해당 query만 무효화한다. 다른 계정의 잠금에는 no-op일 수 있으므로 `locked: false`를 추정해 넣지 않는다.
- mutation은 자동 재시도하지 않는다. `mutateAsync` 오류 처리와 같은 화면에서 중복 클릭 방지는 소비 화면이 담당한다.
- mutation 인자는 실행 시점의 대상이다. 화면 전환 이후 UI는 새 대상의 `lockQuery.data`를 사용한다. 이전 `mutation.data`를 새 문서의 상태로 사용하지 않는다.
- 로그인 세션이 바뀌면 진행 중인 mutation 결과를 이전/새 조회 캐시에 다시 기록하지 않는다.

## 소비 범위

`useLiveEditLock`은 수동 검수 패널용 조합 훅으로 남아 있다. 새 화면은 위 독립 훅을 직접 조합할 수 있다.
현재 서버 잠금은 **계정 소유**이며 탭별 lease를 반환하지 않는다. 자동 heartbeat/이탈 시 해제는 여기서 실행하지 않는다.
실제 편집 화면의 저장·이탈 정책과 저장 시 잠금 검증은 소비 티켓에서 연결한다. 잠금 응답만으로 저장의 원자성이나 탭 소유권이 보장되지는 않는다.

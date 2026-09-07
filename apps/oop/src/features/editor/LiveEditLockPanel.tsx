import type { LiveEditLockTarget } from '@aics/core';
import { Button, Card, Heading, Text } from '@aics/design-system';

import { useLiveEditLock } from './queries';

const labels: Record<string, string> = {
  unauthenticated: '학생 로그인 정보를 확인해 주세요.',
  'missing-target': '발표 제출 대상을 선택해 주세요.',
  'unsupported-target': '이 문서의 편집 잠금은 아직 지원하지 않아요.',
  loading: '편집 잠금 상태를 확인하고 있어요.',
  error: '편집 잠금을 확인하지 못했어요. 다시 확인해 주세요.',
  unlocked: '현재 확인된 편집 잠금이 없어요.',
  'owned-by-account': '현재 계정이 편집 잠금을 보유하고 있어요.',
  locked: '편집 잠금이 설정되어 있어요.',
};

/** Optional controls are for the development contract review surface only. */
export default function LiveEditLockPanel({
  target,
  allowContractActions = false,
}: {
  target: LiveEditLockTarget | null | undefined;
  allowContractActions?: boolean;
}) {
  const lock = useLiveEditLock(target);
  return (
    <Card>
      <section aria-label='편집 잠금 상태'>
        <Heading level={2}>편집 잠금 상태</Heading>
        <p role={lock.state === 'error' ? 'alert' : 'status'}>
          {labels[lock.state]}
        </p>
        {lock.status?.lockedBy ? (
          <Text>잠금 계정: {lock.status.lockedBy}</Text>
        ) : null}
        <p>동시 편집 보호를 준비 중이라 문서 편집은 아직 사용할 수 없어요.</p>
        <Button label='편집 시작' isDisabled />
        <Button
          label='잠금 상태 다시 확인'
          onClick={() => void lock.refetch()}
          isDisabled={!lock.canAcquire}
          variant='secondary'
        />
        {allowContractActions ? (
          <>
            <p>검수용 잠금 요청과 해제는 문서 편집을 활성화하지 않아요.</p>
            <Button
              label='검수용 잠금 요청'
              onClick={() => void lock.acquire()}
              isDisabled={!lock.canAcquire}
              variant='secondary'
            />
            <Button
              label='검수용 잠금 해제'
              onClick={() => void lock.release()}
              isDisabled={!lock.canRelease}
              variant='secondary'
            />
          </>
        ) : null}
      </section>
    </Card>
  );
}

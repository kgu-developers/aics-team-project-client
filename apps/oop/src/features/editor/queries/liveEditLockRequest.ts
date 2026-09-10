import {
  isSupportedLiveEditLockTarget,
  type LiveEditLockStatus,
  type LiveEditLockTarget,
} from '@aics/core';
import type { QueryClient } from '@tanstack/react-query';

import {
  selectHasAuthenticatedSession,
  useAuthStore,
} from '~/features/auth/authStore';

import { liveEditLockKeys } from './liveEditLockKeys';

type Session = ReturnType<typeof useAuthStore.getState>;

export function canRequestLiveEditLock(
  session: Session,
  target: LiveEditLockTarget | null | undefined,
): target is LiveEditLockTarget {
  return (
    selectHasAuthenticatedSession(session) &&
    session.currentUser?.globalRole === 'STUDENT' &&
    Boolean(session.currentUser.studentNumber.trim()) &&
    isSupportedLiveEditLockTarget(target)
  );
}

export function createLiveEditLockRequest(
  session: Session,
  target: LiveEditLockTarget,
) {
  if (!canRequestLiveEditLock(session, target)) {
    throw new Error('로그인한 학생과 유효한 잠금 대상·영역이 필요합니다.');
  }
  const input = { ...target };
  const assertCurrentSession = () => {
    if (useAuthStore.getState() !== session) {
      throw new Error('잠금 요청 중 로그인 세션이 변경됐습니다.');
    }
  };
  assertCurrentSession();
  return {
    target: input,
    queryKey: liveEditLockKeys.detail(session, input),
    assertCurrentSession,
  };
}

type LockRequest = ReturnType<typeof createLiveEditLockRequest>;

export async function cancelLiveEditLockQuery(
  client: QueryClient,
  request: LockRequest,
) {
  await client.cancelQueries({ queryKey: request.queryKey, exact: true });
  request.assertCurrentSession();
}

export async function cacheLiveEditLockStatus(
  client: QueryClient,
  request: LockRequest,
  status: LiveEditLockStatus,
) {
  // A GET started before the mutation must not replace its newer response.
  await cancelLiveEditLockQuery(client, request);
  client.setQueryData(request.queryKey, status);
}

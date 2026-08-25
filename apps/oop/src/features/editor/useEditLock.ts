import { acquireEditLock, removeEditLock } from '@aics/api-client';
import type {
  EditLockReleaseInput,
  EditLockStatus,
  EditLockTarget,
} from '@aics/core';
import { useEffect, useState } from 'react';

type EditLockState = {
  locked: boolean;
  ownerName: string | null;
  pending: boolean;
};

type TargetEditLockState = EditLockState & { targetKey: string | null };

type BeforeEditLockRelease = (
  target: EditLockTarget,
) => Promise<unknown> | unknown;

const EMPTY_STATE: EditLockState = {
  locked: false,
  ownerName: null,
  pending: false,
};

function getTargetKey(target: EditLockTarget | null) {
  return target ? `${target.targetType}:${target.targetId}` : null;
}

/**
 * 현재 탭이 발급받은 lease id를 heartbeat와 해제까지 유지한다.
 * 같은 사용자의 다른 탭은 별도 lease를 가지므로 한 탭의 cleanup이 다른
 * 탭의 잠금을 지울 수 없다. beforeRelease가 있으면 마지막 draft 저장이
 * 끝난 뒤에만 이 탭의 lease를 해제한다.
 */
export function useEditLock(
  target: EditLockTarget | null,
  beforeRelease?: BeforeEditLockRelease,
): EditLockState {
  const targetKey = getTargetKey(target);
  const targetId = target?.targetId;
  const targetType = target?.targetType;
  const [state, setState] = useState<TargetEditLockState>({
    locked: false,
    ownerName: null,
    pending: Boolean(target),
    targetKey,
  });

  useEffect(() => {
    if (!targetId || !targetType) {
      setState({ ...EMPTY_STATE, targetKey: null });
      return;
    }

    const effectTarget: EditLockTarget = { targetId, targetType };
    let active = true;
    let ownedLease: EditLockStatus | null = null;
    let heartbeatPending = false;
    let cleanupBarrier: Promise<void> | null = null;

    setState({
      locked: false,
      ownerName: null,
      pending: true,
      targetKey,
    });

    const waitBeforeRelease = () => {
      cleanupBarrier ??= Promise.resolve()
        .then(() => beforeRelease?.(effectTarget))
        .then(
          () => undefined,
          () => undefined,
        );
      return cleanupBarrier;
    };

    const releaseLease = (
      lock: EditLockStatus,
      barrier: Promise<void> = Promise.resolve(),
    ) => {
      if (!lock.leaseId) return;
      const releaseInput: EditLockReleaseInput = {
        ...effectTarget,
        leaseId: lock.leaseId,
      };
      void barrier
        .then(() => removeEditLock(releaseInput))
        .catch(() => {
          // 서버 TTL이 최종 안전망이다. 화면 이탈 뒤 해제 실패를 표시할
          // UI가 없으므로 다음 진입의 acquire 결과로 상태를 재확인한다.
        });
    };

    const acquire = async (leaseId?: string) => {
      try {
        const lock = await acquireEditLock({ ...effectTarget, leaseId });
        if (!active) {
          releaseLease(lock, cleanupBarrier ?? Promise.resolve());
          return;
        }
        if (!lock.locked || !lock.leaseId)
          throw new Error('편집 잠금 lease를 발급받지 못했어요.');
        ownedLease = lock;
        setState({
          locked: false,
          ownerName: null,
          pending: false,
          targetKey,
        });
      } catch (error) {
        const data = (error as { response?: { data?: { lockedBy?: string } } })
          .response?.data;
        if (active) {
          if (!leaseId) ownedLease = null;
          setState({
            locked: true,
            ownerName: data?.lockedBy ?? '다른 팀원',
            pending: false,
            targetKey,
          });
        }
      }
    };

    void acquire();
    const heartbeat = window.setInterval(() => {
      if (!ownedLease?.leaseId || heartbeatPending) return;
      heartbeatPending = true;
      const leaseId = ownedLease.leaseId;
      void acquire(leaseId).finally(() => {
        heartbeatPending = false;
      });
    }, 45_000);

    return () => {
      active = false;
      window.clearInterval(heartbeat);
      const barrier = waitBeforeRelease();
      if (ownedLease) releaseLease(ownedLease, barrier);
    };
  }, [beforeRelease, targetId, targetKey, targetType]);

  // effect가 실행되기 전 첫 렌더에서도 이전 target의 잠금 상태를 노출하지
  // 않는다. 새 target은 즉시 pending, null target은 즉시 빈 상태다.
  if (state.targetKey !== targetKey)
    return target ? { ...EMPTY_STATE, pending: true } : EMPTY_STATE;
  return {
    locked: state.locked,
    ownerName: state.ownerName,
    pending: state.pending,
  };
}

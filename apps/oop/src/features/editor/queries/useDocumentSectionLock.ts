import type { LiveEditLockTarget } from '@aics/core';
import { useEffect, useRef } from 'react';

import { useAuthStore } from '~/features/auth/authStore';

import { useLiveEditLock } from './useLiveEditLock';
import { useReleaseLiveEditLockMutation } from './useReleaseLiveEditLockMutation';

/** One release must finish before the same area is taken again. */
const pendingReleases = new Map<string, Promise<unknown>>();
const targetKey = (target: LiveEditLockTarget | null) =>
  target ? JSON.stringify(target) : '';

export type DocumentSectionLockOptions = {
  /** Section lock target, or null while the document is not ready. */
  target: LiveEditLockTarget | null;
  /** False when the document is submitted, out of period, or still loading. */
  isWritable: boolean;
  /** Shared polling interval so every editor notices a release alike. */
  pollMs?: number;
};

/**
 * The document editors share one lock policy: take the area on enter, hand it
 * back on leave, confirm ownership before each write, and never take an area
 * another teammate holds.
 */
export function useDocumentSectionLock({
  target,
  isWritable,
  pollMs = 15_000,
}: DocumentSectionLockOptions) {
  const lock = useLiveEditLock(target);
  const releaseLock = useReleaseLiveEditLockMutation();
  const releaseRef = useRef(releaseLock.mutateAsync);
  releaseRef.current = releaseLock.mutateAsync;
  const key = targetKey(target);
  const owned = lock.state === 'owned-by-account';
  const canEdit = isWritable && owned;
  const acquiredRef = useRef<LiveEditLockTarget | null>(null);
  const autoTried = useRef('');
  const lockRef = useRef(lock);
  lockRef.current = lock;

  useEffect(() => {
    if (!target || !isWritable) return;
    if (lock.state !== 'unlocked' || autoTried.current === key) return;
    autoTried.current = key;
    void Promise.resolve(pendingReleases.get(key))
      .then(() => lockRef.current.acquire())
      .then(status => {
        if (status?.locked) acquiredRef.current = target;
      })
      .catch(() => undefined);
  }, [key, isWritable, lock.state, target]);

  useEffect(() => {
    if (owned && target) acquiredRef.current = target;
  }, [owned, target]);

  useEffect(
    () => () => {
      const acquired = acquiredRef.current;
      if (!acquired) return;
      acquiredRef.current = null;
      autoTried.current = '';
      const releaseKey = targetKey(acquired);
      // The status primitive refuses to act while unmounting, so release
      // through the mutation directly.
      const release = releaseRef.current(acquired).catch(() => undefined);
      pendingReleases.set(releaseKey, release);
      void release.finally(() => {
        if (pendingReleases.get(releaseKey) === release)
          pendingReleases.delete(releaseKey);
      });
    },
    [key],
  );

  useEffect(() => {
    if (!target || !isWritable) return;
    const timer = window.setInterval(
      () => void lockRef.current.refetch(),
      pollMs,
    );
    return () => window.clearInterval(timer);
  }, [key, isWritable, pollMs, target]);

  /** Re-check ownership right before a write and renew the hold. */
  const ensureWrite = async () => {
    if (!target || !isWritable)
      throw new Error('지금은 이 영역을 저장할 수 없어요.');
    // Compare the returned status: the hook state is a render snapshot and is
    // still stale right after the request resolves.
    const me = useAuthStore.getState().currentUser?.studentNumber;
    const confirmed = await lockRef.current.confirmOwnership();
    if (confirmed?.locked && confirmed.lockedBy === me) {
      const renewed = await lockRef.current.acquire();
      if (renewed?.locked && renewed.lockedBy === me) return;
    }
    acquiredRef.current = null;
    throw new Error(
      '편집 권한이 만료됐어요. 입력 내용은 유지되며, 권한을 다시 확인한 뒤 저장할 수 있어요.',
    );
  };

  return {
    canEdit,
    ensureWrite,
    error: lock.error,
    isUnavailable: lock.state === 'error',
    lockedByOther: lock.state === 'locked',
    ownerName: lock.status?.lockedByName ?? null,
    pending: lock.pending,
    retry: async () => {
      autoTried.current = '';
      const status = await lock.acquire();
      const me = useAuthStore.getState().currentUser?.studentNumber;
      if (status?.locked && status.lockedBy === me && target)
        acquiredRef.current = target;
      return status;
    },
  };
}

import { useCallback, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY_PREFIX = 'aics:admin-submissions:read';

export type AdminSubmissionReadTarget = {
  milestoneId: string | number;
  sectionId: string | number;
  submissionId: string | number | null;
  version: number;
};

export function getAdminSubmissionReadStorageKey(
  userId: string,
): string | null {
  return userId ? `${STORAGE_KEY_PREFIX}:${userId}` : null;
}

export function getAdminSubmissionReadId(
  target: AdminSubmissionReadTarget,
): string | null {
  if (!target.submissionId || target.version < 1) return null;

  return [
    String(target.sectionId),
    String(target.milestoneId),
    String(target.submissionId),
    String(target.version),
  ].join(':');
}

function readStoredIds(storageKey: string | null): Set<string> {
  if (!storageKey || typeof window === 'undefined') return new Set();

  try {
    const storedValue = window.localStorage.getItem(storageKey);
    if (!storedValue) return new Set();
    const parsedValue = JSON.parse(storedValue) as unknown;
    if (!Array.isArray(parsedValue)) return new Set();

    return new Set(parsedValue.filter(value => typeof value === 'string'));
  } catch {
    return new Set();
  }
}

export function useAdminSubmissionReadState(userId: string | undefined) {
  const storageKey = useMemo(
    () => getAdminSubmissionReadStorageKey(userId ?? ''),
    [userId],
  );
  const [readIds, setReadIds] = useState(() => readStoredIds(storageKey));

  useEffect(() => {
    setReadIds(readStoredIds(storageKey));
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return undefined;

    const handleStorage = (event: StorageEvent) => {
      if (
        event.storageArea === window.localStorage &&
        (event.key === storageKey || event.key === null)
      ) {
        setReadIds(readStoredIds(storageKey));
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [storageKey]);

  const markAsRead = useCallback(
    (target: AdminSubmissionReadTarget) => {
      const readId = getAdminSubmissionReadId(target);
      if (!storageKey || !readId || typeof window === 'undefined') return;

      setReadIds(currentIds => {
        if (currentIds.has(readId)) return currentIds;
        const nextIds = new Set(currentIds);
        nextIds.add(readId);

        try {
          window.localStorage.setItem(storageKey, JSON.stringify([...nextIds]));
        } catch {
          // Storage can be unavailable in privacy mode; retain this tab's state.
        }

        return nextIds;
      });
    },
    [storageKey],
  );

  const isRead = useCallback(
    (target: AdminSubmissionReadTarget) => {
      const readId = getAdminSubmissionReadId(target);
      return !readId || !storageKey || readIds.has(readId);
    },
    [readIds, storageKey],
  );

  return { isRead, markAsRead };
}

import { useCallback, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY_PREFIX = 'aics:student-notices:read';

export function getStudentNoticeReadStorageKey(
  userId: string,
  sectionId: string,
): string | null {
  if (!userId || !sectionId) return null;
  return `${STORAGE_KEY_PREFIX}:${userId}:${sectionId}`;
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

export function useStudentNoticeReadState(userId: string, sectionId: string) {
  const storageKey = useMemo(
    () => getStudentNoticeReadStorageKey(userId, sectionId),
    [sectionId, userId],
  );
  const [readIds, setReadIds] = useState(() => readStoredIds(storageKey));

  useEffect(() => {
    setReadIds(readStoredIds(storageKey));
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return undefined;

    const handleStorage = (event: StorageEvent) => {
      if (event.key === storageKey) setReadIds(readStoredIds(storageKey));
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [storageKey]);

  const markAsRead = useCallback(
    (noticeId: string) => {
      if (!storageKey || typeof window === 'undefined') return;

      setReadIds(currentIds => {
        if (currentIds.has(noticeId)) return currentIds;
        const nextIds = new Set(currentIds);
        nextIds.add(noticeId);

        try {
          window.localStorage.setItem(storageKey, JSON.stringify([...nextIds]));
        } catch {
          // Storage may be unavailable in privacy mode; in-memory state still works.
        }

        return nextIds;
      });
    },
    [storageKey],
  );

  const isRead = useCallback(
    (noticeId: string) => !storageKey || readIds.has(noticeId),
    [readIds, storageKey],
  );

  return { isRead, markAsRead };
}

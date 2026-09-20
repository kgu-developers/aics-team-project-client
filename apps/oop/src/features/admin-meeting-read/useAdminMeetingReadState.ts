import { useCallback, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY_PREFIX = 'aics:admin-meetings:read';

export function getAdminMeetingReadStorageKey(userId: string): string | null {
  return userId ? `${STORAGE_KEY_PREFIX}:${userId}` : null;
}

function readStoredIds(storageKey: string | null): Set<string> {
  if (!storageKey || typeof window === 'undefined') return new Set();

  try {
    const value = window.localStorage.getItem(storageKey);
    const parsed = value ? (JSON.parse(value) as unknown) : [];
    return new Set(
      Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === 'string')
        : [],
    );
  } catch {
    return new Set();
  }
}

export function useAdminMeetingReadState(userId: string | undefined) {
  const storageKey = useMemo(
    () => getAdminMeetingReadStorageKey(userId ?? ''),
    [userId],
  );
  const [readIds, setReadIds] = useState(() => readStoredIds(storageKey));

  useEffect(() => {
    setReadIds(readStoredIds(storageKey));
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return undefined;

    const syncFromStorage = (event: StorageEvent) => {
      if (
        event.storageArea === window.localStorage &&
        (event.key === storageKey || event.key === null)
      ) {
        setReadIds(readStoredIds(storageKey));
      }
    };

    window.addEventListener('storage', syncFromStorage);
    return () => window.removeEventListener('storage', syncFromStorage);
  }, [storageKey]);

  const markAsRead = useCallback(
    (meetingId: string | number) => {
      if (!storageKey || typeof window === 'undefined') return;
      const id = String(meetingId);

      setReadIds(currentIds => {
        if (currentIds.has(id)) return currentIds;
        const nextIds = new Set(currentIds).add(id);
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
    (meetingId: string | number) =>
      !storageKey || readIds.has(String(meetingId)),
    [readIds, storageKey],
  );

  return { isRead, markAsRead };
}

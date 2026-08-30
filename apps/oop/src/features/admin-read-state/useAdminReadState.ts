import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_PREFIX = 'aics:admin:read:';
type Resource = 'meetings' | 'submissions';
type Scope = { adminId: string | null | undefined };
type Entry = { ids: Set<string> };
const entries = new Map<string, Entry>();
const listeners = new Map<string, Set<() => void>>();
const versions = new Map<string, number>();

function keyFor(
  adminId: string | null | undefined,
  sectionId: string,
  resource: Resource,
) {
  return adminId
    ? `${STORAGE_PREFIX}${adminId}:${sectionId}:${resource}`
    : null;
}

function entryFor(key: string) {
  const existing = entries.get(key);
  if (existing) return existing;
  let ids = new Set<string>();
  try {
    const parsed: unknown = JSON.parse(
      typeof window === 'undefined'
        ? '[]'
        : (window.localStorage.getItem(key) ?? '[]'),
    );
    if (Array.isArray(parsed))
      ids = new Set(
        parsed.filter((id): id is string => typeof id === 'string'),
      );
  } catch {
    /* invalid storage is treated as unread */
  }
  const entry = { ids };
  entries.set(key, entry);
  return entry;
}

function scopeFor(key: string) {
  const parts = key.split(':');
  return parts.length >= 6 ? `${parts.slice(0, 4).join(':')}:${parts[5]}` : key;
}
function emit(key: string) {
  versions.set(key, (versions.get(key) ?? 0) + 1);
  listeners.get(scopeFor(key))?.forEach(listener => listener());
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', event => {
    if (!event.key?.startsWith(STORAGE_PREFIX)) return;
    entries.delete(event.key);
    emit(event.key);
  });
}

export function useAdminReadState(resource: Resource, { adminId }: Scope) {
  const scope = adminId ? `${STORAGE_PREFIX}${adminId}:${resource}` : null;
  const subscribe = useCallback(
    (listener: () => void) => {
      if (!adminId) return () => undefined;
      const bucket = listeners.get(scope!) ?? new Set<() => void>();
      bucket.add(listener);
      listeners.set(scope!, bucket);
      return () => bucket.delete(listener);
    },
    [adminId, scope],
  );
  const getSnapshot = useCallback(() => {
    if (!scope) return 0;
    let version = 0;
    versions.forEach((value, key) => {
      if (scopeFor(key) === scope) version += value;
    });
    return version;
  }, [scope]);
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const isRead = useCallback(
    (sectionId: string, id: string) => {
      const key = keyFor(adminId, sectionId, resource);
      return key ? entryFor(key).ids.has(id) : false;
    },
    [adminId, resource],
  );
  const markAsRead = useCallback(
    (sectionId: string, id: string) => {
      const key = keyFor(adminId, sectionId, resource);
      if (!key || typeof window === 'undefined') return;
      const entry = entryFor(key);
      if (entry.ids.has(id)) return;
      entry.ids.add(id);
      window.localStorage.setItem(key, JSON.stringify([...entry.ids]));
      emit(key);
    },
    [adminId, resource],
  );
  return { isRead, markAsRead };
}

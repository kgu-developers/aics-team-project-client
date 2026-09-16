import type { CurrentUser, CurrentUserSection } from '@aics/core';

export function noticeId(value: unknown): number | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined;
  if (!/^[1-9]\d*$/.test(String(value))) return undefined;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : undefined;
}

export function noticeSection(
  user: CurrentUser | null,
  id: number | undefined,
) {
  return id === undefined
    ? undefined
    : user?.sections.find(section => noticeId(section.id) === id);
}

export function canPublishNotice(
  user: CurrentUser | null,
  section: CurrentUserSection | undefined,
) {
  // The backend still verifies actual professor ownership on every write.
  return (
    user?.globalRole === 'PROFESSOR' &&
    section?.role === 'PROFESSOR' &&
    section.status === 'ACTIVE'
  );
}

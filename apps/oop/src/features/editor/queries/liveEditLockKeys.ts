import type { LiveEditLockTarget } from '@aics/core';

// A new auth snapshot also separates logout/login to the same account.
const sessionKeys = new WeakMap<object, number>();
let nextSessionKey = 0;
function getSessionKey(session: object) {
  let key = sessionKeys.get(session);
  if (key === undefined) {
    key = ++nextSessionKey;
    sessionKeys.set(session, key);
  }
  return key;
}

export const liveEditLockKeys = {
  all: ['live-edit-lock'] as const,
  detail: (session: object, target: LiveEditLockTarget | null | undefined) =>
    [
      ...liveEditLockKeys.all,
      getSessionKey(session),
      target?.targetType,
      target?.targetId,
      target?.sectionKey,
    ] as const,
};

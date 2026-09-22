import { useEffect, useState } from 'react';

import { contactWindowInstant } from '~/shared/lib/contactWindowDateTime';

export function useContactWindowClock(
  contactVisibleFrom?: string | null,
  contactVisibleUntil?: string | null,
  teamResultVisibleFrom?: string,
) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const update = () => setNow(Date.now());
    const currentTime = Date.now();
    const boundaries = [
      contactWindowInstant(teamResultVisibleFrom),
      contactWindowInstant(contactVisibleFrom),
      // The server includes the end timestamp; hide contacts immediately after it.
      contactWindowInstant(contactVisibleUntil) + 1,
    ];
    const nextBoundary = boundaries
      .filter(value => Number.isFinite(value) && value > currentTime)
      .sort((a, b) => a - b)[0];
    const timeout =
      nextBoundary === undefined
        ? undefined
        : window.setTimeout(
            update,
            Math.min(nextBoundary - currentTime, 2_147_483_647),
          );
    window.addEventListener('focus', update);
    document.addEventListener('visibilitychange', update);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener('focus', update);
      document.removeEventListener('visibilitychange', update);
    };
  }, [contactVisibleFrom, contactVisibleUntil, now, teamResultVisibleFrom]);

  return Math.max(now, Date.now());
}

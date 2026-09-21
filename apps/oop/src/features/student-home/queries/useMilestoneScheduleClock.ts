import type { StudentMilestoneResponse } from '@aics/core';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { studentHomeKeys } from './studentHomeKeys';
import { milestoneTime } from '../model/studentMilestoneSummary';

/** Refresh team-specific eligibility at schedule boundaries and on returning to the page. */
export function useMilestoneScheduleClock(
  milestones: StudentMilestoneResponse[],
  sectionId?: string,
  teamId?: string,
) {
  const client = useQueryClient();
  const [now, setNow] = useState(Date.now);
  const boundaries = milestones
    .flatMap(item => Object.values(item.schedule))
    .map(milestoneTime)
    .filter(Number.isFinite)
    .sort((a, b) => a - b)
    .join(',');
  useEffect(() => {
    const update = () => {
      setNow(Date.now());
      if (sectionId && teamId) {
        void client.invalidateQueries({
          queryKey: [...studentHomeKeys.all, 'submission', sectionId, teamId],
        });
      }
    };
    const visible = () => {
      if (document.visibilityState === 'visible') update();
    };
    const next = boundaries
      .split(',')
      .map(Number)
      .find(time => time > Date.now());
    const timer =
      next === undefined
        ? undefined
        : window.setTimeout(update, Math.min(next - Date.now(), 2_147_483_647));
    window.addEventListener('focus', update);
    document.addEventListener('visibilitychange', visible);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('focus', update);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [boundaries, sectionId, teamId, client, now]);
  return Math.max(now, Date.now());
}

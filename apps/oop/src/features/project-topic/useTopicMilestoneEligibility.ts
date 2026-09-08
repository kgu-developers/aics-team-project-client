import type { StudentMilestoneResponse } from '@aics/core';
import { useEffect, useState } from 'react';

import { topicMilestoneEligibility } from './topicMilestoneEligibility';

export function useTopicMilestoneEligibility(
  milestones: StudentMilestoneResponse[] | undefined,
  sectionId: string | undefined,
) {
  const [now, setNow] = useState(Date.now);
  const eligibility = topicMilestoneEligibility(
    milestones,
    sectionId,
    Math.max(now, Date.now()),
  );
  const opensAt = eligibility.window?.opensAt;
  const dueAt = eligibility.window?.dueAt;
  useEffect(() => {
    const update = () => setNow(Date.now());
    const next = [opensAt, dueAt].find(
      time => time !== undefined && time > Date.now(),
    );
    const timer =
      next === undefined
        ? undefined
        : window.setTimeout(update, Math.min(next - Date.now(), 2_147_483_647));
    window.addEventListener('focus', update);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('focus', update);
    };
  }, [opensAt, dueAt, now]);
  return eligibility;
}

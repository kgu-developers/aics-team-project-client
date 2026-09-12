import { fetchStudentMilestones } from '@aics/api-client';
import { skipToken, useQuery } from '@tanstack/react-query';

import { studentHomeKeys } from '~/features/student-home/queries';

/** 홈과 같은 캐시 키를 써서 분반 마일스톤 목록을 재사용한다. */
export function useSectionMilestonesQuery(sectionId: string) {
  return useQuery({
    queryKey: [...studentHomeKeys.all, 'milestones', sectionId],
    queryFn: /^\d+$/.test(sectionId)
      ? () => fetchStudentMilestones(sectionId)
      : skipToken,
    retry: false,
  });
}

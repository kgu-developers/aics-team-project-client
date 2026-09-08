import { fetchAdminSectionEnrollments } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { adminStudentTeamKeys } from './adminStudentTeamKeys';

export function useAdminSectionEnrollmentsQuery(sectionId: string | undefined) {
  return useQuery({
    enabled: Boolean(sectionId),
    queryKey: adminStudentTeamKeys.enrollments(sectionId ?? 'disabled'),
    queryFn: () => {
      if (!sectionId) throw new Error('분반 ID가 필요합니다.');
      return fetchAdminSectionEnrollments(sectionId);
    },
  });
}

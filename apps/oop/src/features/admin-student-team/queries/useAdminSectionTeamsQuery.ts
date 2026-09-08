import { fetchAdminSectionTeams } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { adminStudentTeamKeys } from './adminStudentTeamKeys';

export function useAdminSectionTeamsQuery(sectionId: string | undefined) {
  return useQuery({
    enabled: Boolean(sectionId),
    queryKey: adminStudentTeamKeys.teams(sectionId ?? 'disabled'),
    queryFn: () => {
      if (!sectionId) throw new Error('분반 ID가 필요합니다.');
      return fetchAdminSectionTeams(sectionId);
    },
  });
}

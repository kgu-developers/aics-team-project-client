import { fetchAdminUser } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { adminStudentTeamKeys } from './adminStudentTeamKeys';

export function useAdminUserQuery(studentNumber: string | null) {
  return useQuery({
    enabled: Boolean(studentNumber),
    queryKey: adminStudentTeamKeys.user(studentNumber ?? 'disabled'),
    queryFn: () => {
      if (!studentNumber) throw new Error('수강생 학번이 필요합니다.');
      return fetchAdminUser(studentNumber);
    },
  });
}

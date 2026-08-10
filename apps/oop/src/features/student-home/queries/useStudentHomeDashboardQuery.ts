import { fetchStudentHomeDashboard } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { studentHomeKeys } from './studentHomeKeys';

export function useStudentHomeDashboardQuery(sectionId: string) {
  return useQuery({
    enabled: Boolean(sectionId),
    queryKey: studentHomeKeys.dashboard(sectionId),
    queryFn: () => fetchStudentHomeDashboard(sectionId),
  });
}

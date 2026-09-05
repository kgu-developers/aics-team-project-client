import { fetchAdminOopCourses } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { adminOopCourseKeys } from './adminOopCourseKeys';

export function useAdminOopCoursesQuery() {
  return useQuery({
    queryKey: adminOopCourseKeys.list(),
    queryFn: fetchAdminOopCourses,
  });
}

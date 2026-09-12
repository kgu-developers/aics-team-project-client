import { fetchAdminOopCourse } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { adminOopCourseKeys } from './adminOopCourseKeys';

export function useAdminOopCourseQuery(courseId: number | undefined) {
  return useQuery({
    enabled: courseId !== undefined,
    queryKey: adminOopCourseKeys.detail(courseId ?? 'disabled'),
    queryFn: () => {
      if (courseId === undefined) throw new Error('강좌 ID가 필요합니다.');
      return fetchAdminOopCourse(courseId);
    },
  });
}

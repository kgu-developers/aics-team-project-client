import {
  removeAdminOopCourse,
  type AdminOopCoursesResponse,
} from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminOopCourseKeys } from './adminOopCourseKeys';

export function useRemoveAdminOopCourseMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, number>({
    mutationFn: removeAdminOopCourse,
    onSuccess: async (_, courseId) => {
      queryClient.setQueryData<AdminOopCoursesResponse>(
        adminOopCourseKeys.list(),
        current =>
          current
            ? {
                ...current,
                contents: current.contents.filter(
                  course => course.id !== courseId,
                ),
              }
            : current,
      );
      await queryClient.invalidateQueries({
        queryKey: adminOopCourseKeys.all,
      });
    },
  });
}

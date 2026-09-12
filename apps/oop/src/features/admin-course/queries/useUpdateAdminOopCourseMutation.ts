import {
  updateAdminOopCourse,
  type AdminOopCourseInput,
} from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminOopCourseKeys } from './adminOopCourseKeys';

export function useUpdateAdminOopCourseMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    unknown,
    { courseId: number; input: AdminOopCourseInput }
  >({
    mutationFn: updateAdminOopCourse,
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: adminOopCourseKeys.all });
      void queryClient.invalidateQueries({
        queryKey: adminOopCourseKeys.detail(variables.courseId),
      });
    },
  });
}

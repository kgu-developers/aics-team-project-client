import { removeAdminOopCourse } from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminOopCourseKeys } from './adminOopCourseKeys';

export function useRemoveAdminOopCourseMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, number>({
    mutationFn: removeAdminOopCourse,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminOopCourseKeys.all }),
  });
}

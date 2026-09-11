import {
  submitAdminOopCourse,
  type AdminOopCourseInput,
  type AdminOopCoursePersistResponse,
} from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminOopCourseKeys } from './adminOopCourseKeys';

export function useSubmitAdminOopCourseMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    AdminOopCoursePersistResponse,
    unknown,
    AdminOopCourseInput
  >({
    mutationFn: submitAdminOopCourse,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminOopCourseKeys.all }),
  });
}

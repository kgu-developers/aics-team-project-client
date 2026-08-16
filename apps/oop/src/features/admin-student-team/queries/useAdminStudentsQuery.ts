import { useQuery } from '@tanstack/react-query';

import { fetchAdminStudents } from '../api/fetchAdminStudents';

const adminStudentKeys = {
  all: ['admin-students'] as const,
  lists: () => [...adminStudentKeys.all, 'list'] as const,
  list: (sectionId: string) =>
    [...adminStudentKeys.lists(), sectionId] as const,
};

export function useAdminStudentsQuery(sectionId: string) {
  return useQuery({
    enabled: Boolean(sectionId),
    queryKey: adminStudentKeys.list(sectionId),
    queryFn: () => fetchAdminStudents(sectionId),
  });
}

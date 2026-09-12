export const adminOopCourseKeys = {
  all: ['admin-oop-courses'] as const,
  detail: (courseId: string | number) =>
    [...adminOopCourseKeys.all, 'detail', courseId] as const,
  list: () => [...adminOopCourseKeys.all, 'list'] as const,
};

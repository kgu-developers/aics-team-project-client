export const adminOopCourseKeys = {
  all: ['admin-oop-courses'] as const,
  list: () => [...adminOopCourseKeys.all, 'list'] as const,
};

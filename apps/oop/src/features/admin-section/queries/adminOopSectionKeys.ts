import type { AdminOopSectionsFilter } from '@aics/api-client';

export const adminOopSectionKeys = {
  all: ['admin-oop-sections'] as const,
  list: (filter: AdminOopSectionsFilter) =>
    'courseId' in filter
      ? ([...adminOopSectionKeys.all, 'course', filter.courseId] as const)
      : ([
          ...adminOopSectionKeys.all,
          'professor',
          filter.professorId,
          filter.semester ?? null,
          filter.status ?? null,
          filter.year ?? null,
        ] as const),
};

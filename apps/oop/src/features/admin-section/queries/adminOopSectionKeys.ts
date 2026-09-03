import type { AdminOopSectionsFilter } from '@aics/api-client';

export const adminOopSectionKeys = {
  all: ['admin-oop-sections'] as const,
  list: (filter: AdminOopSectionsFilter) =>
    [
      ...adminOopSectionKeys.all,
      'list',
      filter.courseId,
      filter.professorId,
      filter.semester ?? null,
      filter.status ?? null,
      filter.year ?? null,
    ] as const,
};

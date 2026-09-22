import type { AdminOopCourseDto } from '@aics/api-client';
import type { CurrentUser } from '@aics/core';

/**
 * Admin operational screens only expose sections whose own status and parent
 * course status are both ACTIVE. Course management keeps the unfiltered list
 * so archived courses remain directly manageable there.
 */
export function filterActiveAdminSections(
  sections: CurrentUser['sections'],
  courses: readonly AdminOopCourseDto[],
) {
  const activeCourseIds = new Set(
    courses
      .filter(course => course.status === 'ACTIVE')
      .map(course => course.id),
  );

  return sections.filter(
    section =>
      section.status === 'ACTIVE' &&
      section.courseId !== undefined &&
      activeCourseIds.has(section.courseId),
  );
}

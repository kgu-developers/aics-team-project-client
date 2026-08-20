import { fetchTeamAssignmentProjection } from '@aics/api-client';
import type { CurrentUser } from '@aics/core';

import { ROUTES } from '~/app/constants/routes';

import { getTeamAssignmentDestination } from './teamAssignmentDestination';

export async function resolveStudentLoginDestination(currentUser: CurrentUser) {
  if (currentUser.globalRole !== 'STUDENT') {
    return ROUTES.ADMIN;
  }

  const sectionId = currentUser.sections.find(
    section => section.role === 'STUDENT',
  )?.id;

  if (!sectionId) {
    return ROUTES.STUDENT.HOME;
  }

  try {
    const projection = await fetchTeamAssignmentProjection(sectionId);
    return getTeamAssignmentDestination(projection.phase);
  } catch {
    return ROUTES.STUDENT.HOME;
  }
}

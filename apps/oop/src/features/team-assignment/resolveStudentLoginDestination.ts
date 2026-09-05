import { fetchTeamAssignmentProjection } from '@aics/api-client';
import type { CurrentUser } from '@aics/core';

import { ROUTES } from '~/app/constants/routes';

import { isMockDevelopmentMode } from '~/shared/config/developmentMode';

import { getTeamAssignmentDestination } from './teamAssignmentDestination';

export async function resolveStudentLoginDestination(currentUser: CurrentUser) {
  if (currentUser.globalRole !== 'STUDENT') {
    return ROUTES.ADMIN;
  }

  if (
    !isMockDevelopmentMode(import.meta.env.DEV, import.meta.env.VITE_ENABLE_MSW)
  )
    return ROUTES.STUDENT.HOME;

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

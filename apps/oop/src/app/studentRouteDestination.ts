import type { StudentContextStatus } from '~/features/section/resolveStudentContext';
import { resolveContactVisibility } from '~/features/team-assignment/liveTeamAssignment';

import { ROUTES } from './constants/routes';

const noTeamAccessibleRoutes = [
  ROUTES.STUDENT.NOTICES,
  ROUTES.STUDENT.MESSAGES,
] as const;

function isNoTeamAccessibleRoute(pathname: string) {
  const normalizedPathname = pathname.replace(/\/+$/, '') || '/';
  return noTeamAccessibleRoutes.some(
    route =>
      normalizedPathname === route ||
      normalizedPathname.startsWith(`${route}/`),
  );
}

export function getStudentRouteDestination(
  status: StudentContextStatus,
  isDemo: boolean,
  pathname: string,
  section?: {
    contactVisibleFrom?: string | null;
    contactVisibleUntil?: string | null;
  },
  now = Date.now(),
) {
  if (isDemo) return undefined;
  if (status === 'no-team' && !isNoTeamAccessibleRoute(pathname)) {
    return ROUTES.ONBOARDING.TEAM;
  }
  if (
    status === 'ready' &&
    section &&
    resolveContactVisibility(section, now) === 'upcoming'
  ) {
    return ROUTES.ONBOARDING.TEAM;
  }
  return undefined;
}

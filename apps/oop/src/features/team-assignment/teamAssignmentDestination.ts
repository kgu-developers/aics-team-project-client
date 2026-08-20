import type { TeamAssignmentPhase } from '@aics/core';

import { ROUTES } from '~/app/constants/routes';

export function getTeamAssignmentDestination(phase: TeamAssignmentPhase) {
  switch (phase) {
    case 'survey':
    case 'resultWaiting':
      return ROUTES.ONBOARDING.SURVEY;
    case 'result':
      return ROUTES.ONBOARDING.RESULT;
    case 'firstMeeting':
      return ROUTES.ONBOARDING.FIRST_MEETING;
    case 'completed':
      return ROUTES.STUDENT.HOME;
  }
}

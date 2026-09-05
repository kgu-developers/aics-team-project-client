import { createLazyFileRoute } from '@tanstack/react-router';

import TeamActionPlanPage from '~/widgets/team-action-plan/TeamActionPlanPage';

export const Route = createLazyFileRoute('/student/team_/action-plans')({
  component: TeamActionPlanPage,
});

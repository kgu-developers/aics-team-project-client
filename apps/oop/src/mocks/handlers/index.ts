import { adminStudentTeamHandlers } from './adminStudentTeams';
import { adminProfileHandlers } from './adminProfile';
import { adminTeamDashboardHandlers } from './adminTeamDashboard';
import { authHandlers } from './auth';
import { studentHomeHandlers } from './studentHome';
import { submissionHandlers } from './submission';
import { teamAssignmentHandlers } from './teamAssignment';
import { topicHandlers } from './topic';

export const handlers = [
  ...authHandlers,
  ...studentHomeHandlers,
  ...submissionHandlers,
  ...teamAssignmentHandlers,
  ...topicHandlers,
  ...adminTeamDashboardHandlers,
  ...adminStudentTeamHandlers,
  ...adminProfileHandlers,
];

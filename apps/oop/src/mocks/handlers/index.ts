import { adminStudentTeamHandlers } from './adminStudentTeams';
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
  ...adminStudentTeamHandlers,
];

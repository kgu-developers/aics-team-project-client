import { adminStudentTeamHandlers } from './adminStudentTeams';
import { authHandlers } from './auth';
import { studentHomeHandlers } from './studentHome';
import { teamAssignmentHandlers } from './teamAssignment';
import { topicHandlers } from './topic';

export const handlers = [
  ...authHandlers,
  ...studentHomeHandlers,
  ...teamAssignmentHandlers,
  ...topicHandlers,
  ...adminStudentTeamHandlers,
];

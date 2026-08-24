import { adminStudentTeamHandlers } from './adminStudentTeams';
import { authHandlers } from './auth';
import { editLockHandlers } from './editLock';
import { midReportHandlers } from './midReport';
import { presentationHandlers } from './presentation';
import { proposalHandlers } from './proposal';
import { studentHomeHandlers } from './studentHome';
import { submissionHandlers } from './submission';
import { teamAssignmentHandlers } from './teamAssignment';
import { topicHandlers } from './topic';

export const handlers = [
  ...authHandlers,
  ...editLockHandlers,
  ...midReportHandlers,
  ...presentationHandlers,
  ...proposalHandlers,
  ...studentHomeHandlers,
  ...submissionHandlers,
  ...teamAssignmentHandlers,
  ...topicHandlers,
  ...adminStudentTeamHandlers,
];

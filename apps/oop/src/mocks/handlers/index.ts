import { adminMilestoneScheduleHandlers } from './adminMilestoneSchedule';
import { adminNoticeHandlers } from './adminNotices';
import { adminProfileHandlers } from './adminProfile';
import { adminStudentTeamHandlers } from './adminStudentTeams';
import { adminTeamDashboardHandlers } from './adminTeamDashboard';
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
  ...adminMilestoneScheduleHandlers,
  ...adminNoticeHandlers,
  ...editLockHandlers,
  ...midReportHandlers,
  ...presentationHandlers,
  ...proposalHandlers,
  ...studentHomeHandlers,
  ...submissionHandlers,
  ...teamAssignmentHandlers,
  ...topicHandlers,
  ...adminTeamDashboardHandlers,
  ...adminStudentTeamHandlers,
  ...adminProfileHandlers,
];

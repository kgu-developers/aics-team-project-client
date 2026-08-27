import { adminMeetingHandlers } from './adminMeetings';
import { adminMilestoneScheduleHandlers } from './adminMilestoneSchedule';
import { adminMilestoneSubmissionDetailHandlers } from './adminMilestoneSubmissionDetails';
import { adminMilestoneSubmissionsHandlers } from './adminMilestoneSubmissions';
import { adminNoticeHandlers } from './adminNotices';
import { adminPresentationEvaluationHandlers } from './adminPresentationEvaluations';
import { adminProfileHandlers } from './adminProfile';
import { adminStudentTeamHandlers } from './adminStudentTeams';
import { adminTeamDashboardHandlers } from './adminTeamDashboard';
import { authHandlers } from './auth';
import { editLockHandlers } from './editLock';
import { evaluationHandlers } from './evaluation';
import { meetingHandlers } from './meeting';
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
  ...adminMilestoneSubmissionDetailHandlers,
  ...adminMilestoneSubmissionsHandlers,
  ...adminMeetingHandlers,
  ...adminNoticeHandlers,
  ...adminPresentationEvaluationHandlers,
  ...editLockHandlers,
  ...evaluationHandlers,
  ...meetingHandlers,
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

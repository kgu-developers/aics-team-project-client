import { adminMeetingHandlers } from './adminMeetings';
import { adminMilestoneScheduleHandlers } from './adminMilestoneSchedule';
import { adminMilestoneSubmissionDetailHandlers } from './adminMilestoneSubmissionDetails';
import { adminMilestoneSubmissionsHandlers } from './adminMilestoneSubmissions';
import { adminNoticeHandlers } from './adminNotices';
import { adminPresentationEvaluationHandlers } from './adminPresentationEvaluations';
import { adminProfileHandlers } from './adminProfile';
import { adminSectionMilestoneHandlers } from './adminSectionMilestones';
import { adminStudentTeamHandlers } from './adminStudentTeams';
import { authHandlers } from './auth';
import { editLockHandlers } from './editLock';
import { evaluationHandlers } from './evaluation';
import { meetingHandlers } from './meeting';
import { createMeetingApiHandlers } from './meetingApi';
import { midReportHandlers } from './midReport';
import { presentationHandlers } from './presentation';
import { proposalHandlers } from './proposal';
import { sectionHandlers } from './section';
import { studentFeedbackHandlers } from './studentFeedback';
import { studentHomeHandlers } from './studentHome';
import { studentMilestoneHandlers } from './studentMilestones';
import { studentNoticeHandlers } from './studentNotices';
import { studentSubmissionHandlers } from './studentSubmission';
import { submissionHandlers } from './submission';
import {
  teamAssignmentHandlers,
  teamAssignmentUserHandlers,
} from './teamAssignment';
import { topicHandlers } from './topic';

export const handlers = [
  ...sectionHandlers,
  ...authHandlers,
  ...adminMilestoneScheduleHandlers,
  ...adminSectionMilestoneHandlers,
  ...adminMilestoneSubmissionDetailHandlers,
  ...adminMilestoneSubmissionsHandlers,
  ...adminMeetingHandlers,
  ...adminNoticeHandlers,
  ...adminPresentationEvaluationHandlers,
  ...editLockHandlers,
  ...evaluationHandlers,
  ...topicHandlers,
  ...createMeetingApiHandlers(),
  ...meetingHandlers,
  ...midReportHandlers,
  ...presentationHandlers,
  ...proposalHandlers,
  ...studentFeedbackHandlers,
  ...studentHomeHandlers,
  ...studentNoticeHandlers,
  ...studentMilestoneHandlers,
  ...studentSubmissionHandlers,
  ...submissionHandlers,
  ...teamAssignmentHandlers,
  ...teamAssignmentUserHandlers,
  ...adminStudentTeamHandlers,
  ...adminProfileHandlers,
];

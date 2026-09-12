import { adminCourseHandlers } from './adminCourses';
import { adminMeetingHandlers } from './adminMeetings';
import { adminMilestoneScheduleHandlers } from './adminMilestoneSchedule';
import { adminMilestoneSubmissionDetailHandlers } from './adminMilestoneSubmissionDetails';
import { adminMilestoneSubmissionsHandlers } from './adminMilestoneSubmissions';
import { adminNoticeHandlers } from './adminNotices';
import { adminPeerEvaluationFormHandlers } from './adminPeerEvaluationForms';
import { adminPresentationEvaluationHandlers } from './adminPresentationEvaluations';
import { adminProfileHandlers } from './adminProfile';
import { adminRequiredArtifactHandlers } from './adminRequiredArtifacts';
import { adminSectionMilestoneHandlers } from './adminSectionMilestones';
import { adminSectionHandlers } from './adminSections';
import { adminStudentTeamHandlers } from './adminStudentTeams';
import { authHandlers } from './auth';
import { editLockHandlers } from './editLock';
import { evaluationHandlers } from './evaluation';
import { createLiveEditLockHandlers } from './liveEditLock';
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
import { createTeamMessageHandlers } from './teamMessages';
import { topicHandlers } from './topic';
import { liveEditLockMockResources } from '../data/liveEditLock';

export const handlers = [
  ...sectionHandlers,
  ...authHandlers,
  ...adminCourseHandlers,
  ...adminSectionHandlers,
  ...adminMilestoneScheduleHandlers,
  ...adminSectionMilestoneHandlers,
  ...adminRequiredArtifactHandlers,
  ...adminMilestoneSubmissionDetailHandlers,
  ...adminMilestoneSubmissionsHandlers,
  ...adminMeetingHandlers,
  ...adminNoticeHandlers,
  ...adminPresentationEvaluationHandlers,
  ...adminPeerEvaluationFormHandlers,
  ...createLiveEditLockHandlers({
    onlyMidReport: true,
    resources: liveEditLockMockResources.map(resource => ({
      ...resource,
      id: 701,
    })),
  }),
  ...editLockHandlers,
  ...evaluationHandlers,
  ...topicHandlers,
  ...createTeamMessageHandlers(),
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

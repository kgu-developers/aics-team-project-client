import type { ProjectProposalResponse } from '@aics/core';

import { adminCourseHandlers } from './adminCourses';
import { adminEvaluationResultHandlers } from './adminEvaluationResults';
import { adminMeetingHandlers } from './adminMeetings';
import { adminMidReportHandlers } from './adminMidReports';
import { adminMilestoneScheduleHandlers } from './adminMilestoneSchedule';
import { adminMilestoneSubmissionDetailHandlers } from './adminMilestoneSubmissionDetails';
import { adminMilestoneSubmissionsHandlers } from './adminMilestoneSubmissions';
import { adminPeerEvaluationFormHandlers } from './adminPeerEvaluationForms';
import { adminPresentationEvaluationHandlers } from './adminPresentationEvaluations';
import { adminProfileHandlers } from './adminProfile';
import { adminProjectProposalHandlers } from './adminProjectProposal';
import { adminProposalFeedbackHandlers } from './adminProposalFeedbacks';
import { adminRequiredArtifactHandlers } from './adminRequiredArtifacts';
import { adminSectionArtifactHandlers } from './adminSectionArtifacts';
import { adminSectionMilestoneHandlers } from './adminSectionMilestones';
import { adminSectionHandlers } from './adminSections';
import { adminStudentTeamHandlers } from './adminStudentTeams';
import { authHandlers } from './auth';
import { evaluationHandlers } from './evaluation';
import { createLiveEditLockHandlers } from './liveEditLock';
import { createLiveTopicHandlers } from './liveTopic';
import { createMeetingApiHandlers } from './meetingApi';
import { midReportHandlers } from './midReport';
import { createProjectProposalHandlers } from './projectProposal';
import { sectionHandlers } from './section';
import { studentMilestoneHandlers } from './studentMilestones';
import { studentNoticeHandlers } from './studentNotices';
import { studentSubmissionHandlers } from './studentSubmission';
import { teamAssignmentUserHandlers } from './teamAssignment';
import { createTeamContractHandlers } from './teamContract';
import { createTeamMessageHandlers } from './teamMessages';
import { liveEditLockMockResources } from '../data/liveEditLock';
import { meetingApiTeam } from '../data/meetingApi';
import { createProjectProposalFixture } from '../data/projectProposal';

/** HTTP test doubles only. Application bootstrap never imports this module. */
export function createHandlers({
  project: initialProject,
}: {
  project?: ProjectProposalResponse | null;
} = {}) {
  let projectExists = initialProject !== null;
  const project: ProjectProposalResponse = {
    ...createProjectProposalFixture(),
    id: 17,
    teamId: meetingApiTeam.id,
    teamOperation: structuredClone(meetingApiTeam),
    ...structuredClone(initialProject ?? {}),
  };
  const locks = createLiveEditLockHandlers({
    resources: liveEditLockMockResources.map(resource => ({
      ...resource,
      studentNumbers: project.teamOperation.members.map(
        member => member.studentNumber,
      ),
      id:
        resource.targetType === 'PROJECT'
          ? project.id
          : resource.targetType === 'MEETING_RECORD'
            ? 19
            : 701,
    })),
  });
  const projectHandlers = createProjectProposalHandlers({
    project,
    shareProject: true,
    lockStatus: locks.getStatus,
    projectExists: () => projectExists,
  });
  const topics = createLiveTopicHandlers(projectExists ? project : null, {
    shareProject: true,
    projectResponse: () => project,
    onProjectChange: value => {
      projectExists = true;
      return Object.assign(project, value);
    },
  });
  return [
    ...sectionHandlers,
    ...authHandlers,
    ...createTeamContractHandlers(project.teamOperation),
    ...projectHandlers,
    // The project handler above owns GET /teams/:teamId/project. Topic writes
    // update the same object, rather than maintaining a second document model.
    ...topics.filter(
      handler =>
        !(
          handler.info.method === 'GET' &&
          String(handler.info.path).endsWith('/project')
        ),
    ),
    ...locks,
    ...createMeetingApiHandlers().filter(
      handler =>
        !(
          handler.info.method === 'GET' &&
          String(handler.info.path).endsWith('/kickoff')
        ),
    ),
    ...adminCourseHandlers,
    ...adminEvaluationResultHandlers,
    ...adminSectionHandlers,
    ...adminSectionArtifactHandlers,
    // These two existing consumers still need backend contract decisions.
    ...adminMilestoneScheduleHandlers,
    ...adminProfileHandlers,
    ...adminSectionMilestoneHandlers,
    ...adminRequiredArtifactHandlers,
    ...adminMilestoneSubmissionDetailHandlers,
    ...adminMilestoneSubmissionsHandlers,
    ...adminMeetingHandlers,
    ...adminMidReportHandlers,
    ...adminProposalFeedbackHandlers,
    ...adminPresentationEvaluationHandlers,
    ...adminPeerEvaluationFormHandlers,
    ...adminProjectProposalHandlers,
    ...evaluationHandlers,
    ...createTeamMessageHandlers(),
    ...midReportHandlers,
    ...studentNoticeHandlers,
    ...studentMilestoneHandlers,
    ...studentSubmissionHandlers,
    ...teamAssignmentUserHandlers,
    ...adminStudentTeamHandlers,
  ];
}

export const handlers = createHandlers();

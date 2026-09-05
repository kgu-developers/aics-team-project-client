import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { http, HttpResponse } from 'msw';

import { getMockAuthenticatedAccount } from '../authSession';
import {
  getPeerResponse,
  getPeerTargets,
  getPresentationEvaluationOverview,
} from '../data/evaluation';
import {
  ensureMidReportFeedbackRevision,
  ensureMidReportFeedbackRevisionResubmitted,
  getCurrentMidReport,
  resetMidReportMockData,
} from '../data/midReport';
import { getCurrentPresentation } from '../data/presentation';
import {
  ensureProposalFeedbackRevision,
  ensureProposalFeedbackRevisionResubmitted,
  getCurrentProposal,
  resetProposalFixture,
} from '../data/proposal';
import {
  getMidReportFeedback,
  getProposalFeedbackResponse,
  resetStudentFeedbackMockData,
} from '../data/studentFeedback';
import {
  createStudentHomeDashboardWithEvaluationProgress,
  createStudentHomeDashboardWithFeedbackSubmissions,
  createStudentHomeDashboardWithFinalReportSubmission,
  createStudentHomeDashboardWithMidReportProgress,
  createStudentHomeDashboardWithPresentationSubmission,
  createStudentHomeDashboardWithPresentationProgress,
  createStudentHomeDashboardWithProposalProgress,
  createStudentHomeDashboardWithTopicBoard,
  createStudentHomeDashboardPreview,
  isMilestonePreviewScenario,
  type MilestonePreviewScenario,
} from '../data/studentHome';
import {
  demoSubmissionTeamId,
  ensureFinalReportSubmitted,
  ensurePresentationNotSubmitted,
  getSubmissionByMilestone,
  resetSubmissionMockData,
} from '../data/submission';
import { getTopicBoard } from '../data/topic';

const demoStudentSectionId = 'oop-2026-2-01';

let activeMilestonePreview: MilestonePreviewScenario | null | undefined;

export function resetStudentHomePreviewTransitionState() {
  activeMilestonePreview = undefined;
}

function prepareMilestonePreview(
  previewScenario: MilestonePreviewScenario | null,
) {
  if (
    activeMilestonePreview !== undefined &&
    activeMilestonePreview !== previewScenario
  ) {
    resetProposalFixture();
    resetMidReportMockData();
    resetStudentFeedbackMockData();
    resetSubmissionMockData();
  }
  activeMilestonePreview = previewScenario;

  if (
    previewScenario === 'proposal-feedback' ||
    previewScenario === 'proposal-feedback-mid-report'
  ) {
    ensureProposalFeedbackRevision();
  }
  if (previewScenario === 'proposal-feedback-ready') {
    ensureProposalFeedbackRevisionResubmitted();
  }
  if (previewScenario === 'mid-feedback') {
    ensureMidReportFeedbackRevision();
  }
  if (previewScenario === 'mid-feedback-ready') {
    ensureMidReportFeedbackRevisionResubmitted();
  }
  if (previewScenario === 'final-report') {
    ensureFinalReportSubmitted();
  }
  if (previewScenario === 'presentation-material-empty') {
    ensurePresentationNotSubmitted();
  }
}

export const studentHomeHandlers = [
  http.get(
    `${API_BASE_URL}${ENDPOINTS.SECTION.STUDENT_DASHBOARD(':sectionId')}`,
    ({ params, request }) => {
      const account = getMockAuthenticatedAccount(request);
      if (!account || account.user.globalRole !== 'STUDENT') {
        return HttpResponse.json(
          { code: 'UNAUTHORIZED', message: '학생 대시보드에 로그인해 주세요.' },
          { status: 401 },
        );
      }

      if (params.sectionId === 'section-error') {
        return HttpResponse.json(
          { code: 'SECTION_NOT_FOUND', message: '분반을 찾을 수 없습니다.' },
          { status: 404 },
        );
      }

      if (
        !account.user.sections.some(
          section => section.id === String(params.sectionId),
        )
      ) {
        return HttpResponse.json(
          {
            code: 'SECTION_ACCESS_DENIED',
            message: '이 분반의 학생 대시보드에 접근할 수 없습니다.',
          },
          { status: 403 },
        );
      }

      if (params.sectionId !== demoStudentSectionId) {
        return HttpResponse.json(
          { code: 'SECTION_NOT_FOUND', message: '분반을 찾을 수 없습니다.' },
          { status: 404 },
        );
      }

      const previewHeader = request.headers.get('X-OOP-Milestone-Preview');
      const previewScenario = isMilestonePreviewScenario(previewHeader)
        ? previewHeader
        : null;
      // 같은 preview의 사용자 작업은 유지하고, preview가 바뀔 때만
      // 공유 mock 문서를 초기화해 시나리오 간 상태 누수를 막는다.
      prepareMilestonePreview(previewScenario);
      const baseDashboard = previewScenario
        ? createStudentHomeDashboardPreview(previewScenario)
        : createStudentHomeDashboardWithTopicBoard(
            getTopicBoard(
              account.user.studentNumber === '20260001'
                ? 'student-a'
                : account.user.studentNumber === '20260003'
                  ? 'student-b'
                  : 'student-c',
            ),
          );

      const withProposalProgress =
        createStudentHomeDashboardWithProposalProgress(
          baseDashboard,
          getCurrentProposal(),
        );

      const withDocumentProgress =
        createStudentHomeDashboardWithPresentationProgress(
          createStudentHomeDashboardWithMidReportProgress(
            withProposalProgress,
            getCurrentMidReport(),
          ),
          getCurrentPresentation(),
        );
      const withPresentationSubmission =
        createStudentHomeDashboardWithPresentationSubmission(
          withDocumentProgress,
          getSubmissionByMilestone(
            demoSubmissionTeamId,
            'presentation',
            account.user.id,
          ),
        );
      const withSubmissionProgress =
        createStudentHomeDashboardWithFinalReportSubmission(
          withPresentationSubmission,
          getSubmissionByMilestone(
            demoSubmissionTeamId,
            'final-report',
            account.user.id,
          ),
          Boolean(
            account.user.currentTeam?.members.find(
              member => member.id === account.user.id,
            )?.isLeader,
          ),
        );
      const userId = account.user.studentNumber;

      const dashboard = createStudentHomeDashboardWithEvaluationProgress(
        withSubmissionProgress,
        getPresentationEvaluationOverview(userId),
        getPeerResponse(userId),
        getPeerTargets(userId).length,
      );
      const teamId = account.user.currentTeam?.id ?? '';

      return HttpResponse.json(
        createStudentHomeDashboardWithFeedbackSubmissions(
          dashboard,
          getProposalFeedbackResponse(teamId),
          getMidReportFeedback(teamId),
          getCurrentProposal(),
          getCurrentMidReport(),
        ),
      );
    },
  ),
];

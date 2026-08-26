import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { http, HttpResponse } from 'msw';

import {
  getPeerResponse,
  getPeerTargets,
  getPresentationEvaluationOverview,
} from '../data/evaluation';
import { getCurrentMidReport } from '../data/midReport';
import { getCurrentPresentation } from '../data/presentation';
import { getCurrentProposal } from '../data/proposal';
import {
  createStudentHomeDashboardWithEvaluationProgress,
  createStudentHomeDashboardWithFinalReportSubmission,
  createStudentHomeDashboardWithMidReportProgress,
  createStudentHomeDashboardWithPresentationProgress,
  createStudentHomeDashboardWithProposalProgress,
  createStudentHomeDashboardWithTopicBoard,
  createStudentHomeDashboardPreview,
  isMilestonePreviewScenario,
} from '../data/studentHome';
import {
  demoSubmissionTeamId,
  getSubmissionByMilestone,
} from '../data/submission';
import { getTopicBoard } from '../data/topic';
import { getDemoStudentAccount } from '../data/users';

const demoStudentSectionId = 'oop-2026-2-01';

export const studentHomeHandlers = [
  http.get(
    `${API_BASE_URL}${ENDPOINTS.SECTION.STUDENT_DASHBOARD(':sectionId')}`,
    ({ params, request }) => {
      const authorization = request.headers.get('authorization');

      const accessToken = authorization?.replace('Bearer ', '') ?? null;
      const account = getDemoStudentAccount(accessToken);
      if (!account) {
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

      const previewScenario = request.headers.get('X-OOP-Milestone-Preview');
      const baseDashboard = isMilestonePreviewScenario(previewScenario)
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
      const withSubmissionProgress =
        createStudentHomeDashboardWithFinalReportSubmission(
          withDocumentProgress,
          getSubmissionByMilestone(demoSubmissionTeamId, 'final-report'),
        );
      const userId = account.user.studentNumber;

      return HttpResponse.json(
        createStudentHomeDashboardWithEvaluationProgress(
          withSubmissionProgress,
          getPresentationEvaluationOverview(userId),
          getPeerResponse(userId),
          getPeerTargets(userId).length,
        ),
      );
    },
  ),
];

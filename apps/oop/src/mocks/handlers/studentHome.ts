import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { http, HttpResponse } from 'msw';

import {
  createStudentHomeDashboardWithFinalReportSubmission,
  createStudentHomeDashboardWithTopicBoard,
  createStudentHomeDashboardPreview,
  isMilestonePreviewScenario,
} from '../data/studentHome';
import { getSubmissionByMilestone } from '../data/submission';
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

      if (params.sectionId !== demoStudentSectionId) {
        return HttpResponse.json(
          {
            code: 'SECTION_ACCESS_DENIED',
            message: '이 분반의 학생 대시보드에 접근할 수 없습니다.',
          },
          { status: 403 },
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

      return HttpResponse.json(
        createStudentHomeDashboardWithFinalReportSubmission(
          baseDashboard,
          getSubmissionByMilestone('final-report'),
        ),
      );
    },
  ),
];

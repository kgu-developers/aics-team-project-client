import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { http, HttpResponse } from 'msw';

import {
  createStudentHomeDashboardPreview,
  isMilestonePreviewScenario,
  studentHomeDashboardFixture,
} from '../data/studentHome';
import { demoAccessToken } from '../data/users';

const demoStudentSectionId = 'oop-2026-2-01';

export const studentHomeHandlers = [
  http.get(
    `${API_BASE_URL}${ENDPOINTS.SECTION.STUDENT_DASHBOARD(':sectionId')}`,
    ({ params, request }) => {
      const authorization = request.headers.get('authorization');

      if (authorization !== `Bearer ${demoAccessToken}`) {
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
      const dashboard = isMilestonePreviewScenario(previewScenario)
        ? createStudentHomeDashboardPreview(previewScenario)
        : studentHomeDashboardFixture;

      return HttpResponse.json(dashboard);
    },
  ),
];

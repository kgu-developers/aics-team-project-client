import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import type { SectionAnnouncementListResponse } from '@aics/core';
import { http, HttpResponse } from 'msw';

import {
  getMockAuthenticatedAccount,
  mockCsrfResponseHeaders,
} from '../authSession';
import { getMockMySections } from '../data/sections';
import { studentNoticeAnnouncements } from '../data/studentNotices';

export const studentNoticeHandlers = [
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ANNOUNCEMENTS.SECTION_LIST(':sectionId')}`,
    ({ params, request }) => {
      const account = getMockAuthenticatedAccount(request);

      if (!account) {
        return new HttpResponse(null, { status: 401 });
      }

      const sectionId = Number(params.sectionId);
      if (!Number.isSafeInteger(sectionId) || sectionId <= 0) {
        return HttpResponse.json(
          {
            code: 'INVALID_INPUT',
            message: '분반 ID 형식이 올바르지 않습니다.',
          },
          { status: 400 },
        );
      }

      const accessibleSections = getMockMySections(
        account.credentials.studentNumber,
        { status: 'ACTIVE' },
      );
      if (!accessibleSections.some(section => section.id === sectionId)) {
        return HttpResponse.json(
          {
            code: 'ACCESS_DENIED',
            message: '이 분반의 공지사항에 접근할 수 없습니다.',
          },
          { status: 403 },
        );
      }

      return HttpResponse.json<SectionAnnouncementListResponse>(
        {
          contents: studentNoticeAnnouncements.filter(
            announcement => announcement.sectionId === sectionId,
          ),
        },
        { headers: mockCsrfResponseHeaders() },
      );
    },
  ),
];

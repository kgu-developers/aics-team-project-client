import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { http, HttpResponse } from 'msw';

import { studentNoticeAnnouncements } from '../data/studentNotices';
import { getDemoStudentAccount } from '../data/users';

export const studentNoticeHandlers = [
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ANNOUNCEMENTS.SECTION_LIST(':sectionId')}`,
    ({ params, request }) => {
      const accessToken =
        request.headers.get('authorization')?.replace('Bearer ', '') ?? null;
      const account = getDemoStudentAccount(accessToken);

      if (!account) {
        return HttpResponse.json(
          { code: 'UNAUTHORIZED', message: '학생 로그인이 필요합니다.' },
          { status: 401 },
        );
      }

      const sectionId = String(params.sectionId);
      if (!account.user.sections.some(section => section.id === sectionId)) {
        return HttpResponse.json(
          {
            code: 'SECTION_ACCESS_DENIED',
            message: '이 분반의 공지사항에 접근할 수 없습니다.',
          },
          { status: 403 },
        );
      }

      return HttpResponse.json(
        studentNoticeAnnouncements.filter(
          announcement => announcement.sectionId === sectionId,
        ),
      );
    },
  ),
];

import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { http, HttpResponse } from 'msw';

import {
  adminNoticeDetails,
  adminNotices,
  noticeListPageSize,
  noticeSectionFilters,
} from '../data/adminNotices';
import { demoAdminAccessToken } from '../data/users';

export const adminNoticeHandlers = [
  http.get(`${API_BASE_URL}${ENDPOINTS.ADMIN.NOTICES}`, ({ request }) => {
    if (
      request.headers.get('authorization') !== `Bearer ${demoAdminAccessToken}`
    ) {
      return HttpResponse.json(
        { code: 'UNAUTHORIZED', message: '관리자 로그인이 필요합니다.' },
        { status: 401 },
      );
    }

    return HttpResponse.json({
      notices: adminNotices,
      pageSize: noticeListPageSize,
      sectionFilters: noticeSectionFilters,
    });
  }),
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.NOTICE_DETAIL(':noticeId')}`,
    ({ params, request }) => {
      if (
        request.headers.get('authorization') !==
        `Bearer ${demoAdminAccessToken}`
      ) {
        return HttpResponse.json(
          { code: 'UNAUTHORIZED', message: '관리자 로그인이 필요합니다.' },
          { status: 401 },
        );
      }

      const notice = adminNotices.find(
        candidate => candidate.id === String(params.noticeId),
      );
      const detail = notice ? adminNoticeDetails[notice.id] : undefined;

      if (!notice || !detail) {
        return HttpResponse.json(
          { code: 'NOTICE_NOT_FOUND', message: '공지사항을 찾을 수 없습니다.' },
          { status: 404 },
        );
      }

      return HttpResponse.json({ ...detail, notice });
    },
  ),
  http.delete(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.NOTICE_ATTACHMENT(':noticeId')}`,
    ({ params, request }) => {
      if (
        request.headers.get('authorization') !==
        `Bearer ${demoAdminAccessToken}`
      ) {
        return HttpResponse.json(
          { code: 'UNAUTHORIZED', message: '관리자 로그인이 필요합니다.' },
          { status: 401 },
        );
      }

      if (
        !Object.prototype.hasOwnProperty.call(
          adminNoticeDetails,
          String(params.noticeId),
        )
      ) {
        return HttpResponse.json(
          { code: 'NOTICE_NOT_FOUND', message: '공지사항을 찾을 수 없습니다.' },
          { status: 404 },
        );
      }

      return new HttpResponse(null, { status: 204 });
    },
  ),
];

import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { http, HttpResponse } from 'msw';

import { adminMeetingRecordsFixture } from '../data/adminMeetings';
import { getDemoUserAccount } from '../data/users';

function getAccessibleSectionIds(authorization: string | null) {
  const accessToken = authorization?.replace('Bearer ', '') ?? null;
  const account = getDemoUserAccount(accessToken);

  if (!account || account.user.globalRole === 'STUDENT') return null;

  return account.user.sections.map(section => section.id);
}

export const adminMeetingHandlers = [
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.MEETING_RECORDS}`,
    ({ request }) => {
      const accessibleSectionIds = getAccessibleSectionIds(
        request.headers.get('authorization'),
      );

      if (!accessibleSectionIds) {
        return HttpResponse.json(
          { code: 'UNAUTHORIZED', message: '관리자 로그인이 필요합니다.' },
          { status: 401 },
        );
      }

      const searchParams = new URL(request.url).searchParams;
      const sectionId = searchParams.get('sectionId');
      const teamId = searchParams.get('teamId');

      return HttpResponse.json({
        records: adminMeetingRecordsFixture
          .filter(record => accessibleSectionIds.includes(record.sectionId))
          .filter(record => !sectionId || record.sectionId === sectionId)
          .filter(record => !teamId || record.teamId === teamId)
          .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
          .map(record => ({
            createdAt: record.createdAt,
            id: record.id,
            sectionId: record.sectionId,
            sectionLabel: record.sectionLabel,
            teamId: record.teamId,
            teamLabel: record.teamLabel,
            title: record.title,
          })),
      });
    },
  ),

  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.MEETING_RECORD(':meetingId')}`,
    ({ params, request }) => {
      const accessibleSectionIds = getAccessibleSectionIds(
        request.headers.get('authorization'),
      );

      if (!accessibleSectionIds) {
        return HttpResponse.json(
          { code: 'UNAUTHORIZED', message: '관리자 로그인이 필요합니다.' },
          { status: 401 },
        );
      }

      const meetingId = params.meetingId;
      const sectionId = new URL(request.url).searchParams.get('sectionId');

      if (typeof meetingId !== 'string' || !sectionId) {
        return HttpResponse.json(
          {
            code: 'MEETING_LOOKUP_INVALID',
            message: '회의록과 분반 정보가 필요합니다.',
          },
          { status: 400 },
        );
      }

      if (!accessibleSectionIds.includes(sectionId)) {
        return HttpResponse.json(
          {
            code: 'FORBIDDEN',
            message: '담당 분반의 회의록만 조회할 수 있습니다.',
          },
          { status: 403 },
        );
      }

      const record = adminMeetingRecordsFixture.find(
        item => item.id === meetingId && item.sectionId === sectionId,
      );

      if (!record) {
        return HttpResponse.json(
          { code: 'MEETING_NOT_FOUND', message: '회의록을 찾을 수 없습니다.' },
          { status: 404 },
        );
      }

      return HttpResponse.json(record);
    },
  ),
];

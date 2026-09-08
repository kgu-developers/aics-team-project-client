import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { http, HttpResponse } from 'msw';

import { getRichTextPlainText } from '../../features/admin-meeting/model';
import { getMockAuthenticatedAccount } from '../authSession';
import { adminMeetingRecordsFixture } from '../data/adminMeetings';
import { adminStudentsFixture } from '../data/adminStudentTeams';

function getAccessibleSectionIds(request: Request) {
  const account = getMockAuthenticatedAccount(request);

  if (!account || account.user.globalRole === 'STUDENT') return null;

  return account.user.sections.map(section => section.id);
}

export const adminMeetingHandlers = [
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.MEETING_RECORDS}`,
    ({ request }) => {
      const accessibleSectionIds = getAccessibleSectionIds(request);

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
            authorName: record.createdBy.name,
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
    `${API_BASE_URL}${ENDPOINTS.ADMIN.MEETING_RECORDS_LIST}`,
    ({ request }) => {
      const accessibleSectionIds = getAccessibleSectionIds(request);

      if (!accessibleSectionIds) {
        return HttpResponse.json(
          { code: 'UNAUTHORIZED', message: '관리자 로그인이 필요합니다.' },
          { status: 401 },
        );
      }

      const searchParams = new URL(request.url).searchParams;
      const sectionId = searchParams.get('sectionId');
      const teamId = searchParams.get('teamId');
      const page = Math.max(Number(searchParams.get('page') ?? 0), 0);
      const size = Math.min(
        Math.max(Number(searchParams.get('size') ?? 20), 1),
        100,
      );
      const records = adminMeetingRecordsFixture
        .filter(record => accessibleSectionIds.includes(record.sectionId))
        .filter(record => !sectionId || record.sectionId === sectionId)
        .filter(
          record =>
            !teamId ||
            String(record.teamId === 'team-1151-1' ? 11 : 12) === teamId,
        )
        .sort((left, right) => right.heldAt.localeCompare(left.heldAt));
      const start = page * size;

      return HttpResponse.json({
        contents: records.slice(start, start + size).map((record, index) => ({
          authorId: record.createdBy.userId,
          content: getRichTextPlainText(record.content),
          id: start + index + 1,
          location: record.location,
          meetingAt: record.heldAt.slice(0, 16).replace('T', ' '),
          participantCount: record.participants.length,
          phase: 'MID_CHECK',
          sectionId: 1,
          sectionName: record.sectionLabel,
          teamId: record.teamId === 'team-1151-1' ? 11 : 12,
          teamName: record.teamLabel,
        })),
        pageable: {
          isEnd: start + size >= records.length,
          page,
          size,
          totalElements: records.length,
          totalPages: Math.ceil(records.length / size),
        },
      });
    },
  ),
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.MEETING_RECORD_DETAIL(':meetingId')}`,
    ({ params, request }) => {
      const accessibleSectionIds = getAccessibleSectionIds(request);
      const recordIndex = Number(params.meetingId) - 1;
      const record = adminMeetingRecordsFixture[recordIndex];

      if (!accessibleSectionIds) {
        return HttpResponse.json(
          { code: 'UNAUTHORIZED', message: '관리자 로그인이 필요합니다.' },
          { status: 401 },
        );
      }

      if (!record || !accessibleSectionIds.includes(record.sectionId)) {
        return HttpResponse.json(
          { code: 'MEETING_NOT_FOUND', message: '회의록을 찾을 수 없습니다.' },
          { status: 404 },
        );
      }

      return HttpResponse.json({
        authorId: record.createdBy.userId,
        content: getRichTextPlainText(record.content),
        createdAt: record.createdAt.slice(0, 16).replace('T', ' '),
        id: recordIndex + 1,
        location: record.location,
        meetingAt: record.heldAt.slice(0, 16).replace('T', ' '),
        participantIds: record.participants.map(
          participant =>
            adminStudentsFixture.find(
              student => student.id === participant.userId,
            )?.studentNumber ?? participant.userId,
        ),
        phase: 'MID_CHECK',
        sectionId: 1,
        sectionName: record.sectionLabel,
        teamId: record.teamId === 'team-1151-1' ? 11 : 12,
        teamName: record.teamLabel,
        title: record.title,
        updatedAt: record.updatedAt.slice(0, 16).replace('T', ' '),
      });
    },
  ),

  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.MEETING_RECORD(':meetingId')}`,
    ({ params, request }) => {
      const accessibleSectionIds = getAccessibleSectionIds(request);

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

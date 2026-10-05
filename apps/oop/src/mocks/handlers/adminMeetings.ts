import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { http, HttpResponse } from 'msw';

import { getRichTextPlainText } from '../../features/admin-meeting/model';
import { getMockAuthenticatedAccount } from '../authSession';
import {
  adminMeetingEditLogsFixture,
  adminMeetingRecordsFixture,
} from '../data/adminMeetings';
import {
  adminStudentsFixture,
  adminTeamsFixture,
} from '../data/adminStudentTeams';

function getAccessibleSectionIds(request: Request) {
  const account = getMockAuthenticatedAccount(request);

  if (!account || account.user.globalRole === 'STUDENT') return null;

  return account.user.sections.map(section => section.id);
}

function getAdminMeetingRecordId(
  record: (typeof adminMeetingRecordsFixture)[number],
) {
  const match = /^admin-meeting-(\d+)$/.exec(record.id);

  if (!match) {
    throw new Error(
      `관리자 회의록 fixture ID 형식이 올바르지 않습니다: ${record.id}`,
    );
  }

  return Number(match[1]);
}

function isAccessibleRecordSection(
  record: (typeof adminMeetingRecordsFixture)[number],
  accessibleSectionIds: string[],
) {
  return (
    accessibleSectionIds.includes(record.sectionId) ||
    accessibleSectionIds.includes(String(record.apiSectionId))
  );
}

function matchesRequestedSection(
  record: (typeof adminMeetingRecordsFixture)[number],
  sectionId: string,
) {
  return (
    record.sectionId === sectionId || String(record.apiSectionId) === sectionId
  );
}

function getAdminMeetingActionId(actionId: string) {
  const match = /^admin-meeting-action-(\d+)$/.exec(actionId);

  if (!match) {
    throw new Error(
      `관리자 액션플랜 fixture ID 형식이 올바르지 않습니다: ${actionId}`,
    );
  }

  return Number(match[1]);
}

function getAdminTeamId(teamId: string) {
  const match = /^team-\d+-(\d+)$/.exec(teamId);

  if (!match) {
    throw new Error(`관리자 팀 fixture ID 형식이 올바르지 않습니다: ${teamId}`);
  }

  return Number(match[1]);
}

function formatFixtureDateTime(value: string | null) {
  return value ? value.slice(0, 16).replace('T', ' ') : null;
}

function invalidRequest(message: string) {
  return HttpResponse.json(
    { code: 'INVALID_REQUEST', message },
    { status: 400 },
  );
}

export const adminMeetingHandlers = [
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_MEETING_RECORD_LOGS(':sectionId')}`,
    ({ params, request }) => {
      const accessibleSectionIds = getAccessibleSectionIds(request);

      if (!accessibleSectionIds) {
        return HttpResponse.json(
          { code: 'UNAUTHORIZED', message: '관리자 로그인이 필요합니다.' },
          { status: 401 },
        );
      }

      const sectionId = String(params.sectionId);
      if (!accessibleSectionIds.includes(sectionId)) {
        return HttpResponse.json(
          {
            code: 'MEETING_RECORD_EDIT_LOG_ACCESS_DENIED',
            message: '담당 분반의 회의록 수정 이력만 조회할 수 있습니다.',
          },
          { status: 403 },
        );
      }

      const searchParams = new URL(request.url).searchParams;
      const requestedTeamId = searchParams.get('teamId');
      const requestedMeetingRecordId = searchParams.get('meetingRecordId');
      const page = Number(searchParams.get('page') ?? 0);
      const size = Number(searchParams.get('size') ?? 20);

      if (!Number.isInteger(page) || page < 0) {
        return invalidRequest('page는 0 이상의 정수여야 합니다.');
      }
      if (!Number.isInteger(size) || size < 1 || size > 100) {
        return invalidRequest('size는 1부터 100 사이의 정수여야 합니다.');
      }

      const sectionRecords = adminMeetingRecordsFixture.filter(record =>
        matchesRequestedSection(record, sectionId),
      );
      const sectionFixtureIds = new Set(
        sectionRecords.map(record => record.sectionId),
      );
      const requestedTeamIsInSection =
        !requestedTeamId ||
        adminTeamsFixture.some(
          team =>
            sectionFixtureIds.has(team.sectionId) &&
            String(getAdminTeamId(team.id)) === requestedTeamId,
        );
      const requestedMeetingRecordIsInSection =
        !requestedMeetingRecordId ||
        sectionRecords.some(
          record =>
            String(getAdminMeetingRecordId(record)) ===
            requestedMeetingRecordId,
        );

      if (!requestedTeamIsInSection || !requestedMeetingRecordIsInSection) {
        return HttpResponse.json(
          {
            code: 'MEETING_RECORD_EDIT_LOG_ACCESS_DENIED',
            message: '담당 분반의 회의록 수정 이력만 조회할 수 있습니다.',
          },
          { status: 403 },
        );
      }

      const recordsById = new Map(
        sectionRecords.map(record => [record.id, record]),
      );
      const logs = adminMeetingEditLogsFixture
        .map(log => ({ log, record: recordsById.get(log.meetingId) }))
        .filter(
          (
            item,
          ): item is {
            log: (typeof adminMeetingEditLogsFixture)[number];
            record: (typeof adminMeetingRecordsFixture)[number];
          } => item.record !== undefined,
        )
        .filter(
          ({ record }) =>
            !requestedTeamId || String(record.apiTeamId) === requestedTeamId,
        )
        .filter(
          ({ record }) =>
            !requestedMeetingRecordId ||
            String(getAdminMeetingRecordId(record)) ===
              requestedMeetingRecordId,
        )
        .sort((left, right) => {
          const createdAtComparison = right.log.createdAt.localeCompare(
            left.log.createdAt,
          );

          return createdAtComparison || right.log.id - left.log.id;
        });
      const start = page * size;

      return HttpResponse.json({
        contents: logs.slice(start, start + size).map(({ log, record }) => ({
          createdAt: formatFixtureDateTime(log.createdAt),
          editorId: log.editorId,
          editorName: log.editorName,
          id: log.id,
          meetingRecordId: getAdminMeetingRecordId(record),
          meetingRecordTitle: record.title,
          reason: log.reason,
          teamId: record.apiTeamId,
          teamName: record.teamLabel,
        })),
        pageable: {
          isEnd: start + size >= logs.length,
          page,
          size,
          totalElements: logs.length,
          totalPages: Math.ceil(logs.length / size),
        },
      });
    },
  ),
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_MEETING_ACTIONS(':sectionId')}`,
    ({ params, request }) => {
      const accessibleSectionIds = getAccessibleSectionIds(request);

      if (!accessibleSectionIds) {
        return HttpResponse.json(
          { code: 'UNAUTHORIZED', message: '관리자 로그인이 필요합니다.' },
          { status: 401 },
        );
      }

      const sectionId = String(params.sectionId);
      if (!accessibleSectionIds.includes(sectionId)) {
        return HttpResponse.json(
          {
            code: 'SECTION_ACTION_ACCESS_DENIED',
            message: '담당 분반의 액션플랜만 조회할 수 있습니다.',
          },
          { status: 403 },
        );
      }

      const searchParams = new URL(request.url).searchParams;
      const requestedTeamId = searchParams.get('teamId');
      const requestedMeetingRecordId = searchParams.get('meetingRecordId');
      const requestedStatus = searchParams.get('status');
      const page = Number(searchParams.get('page') ?? 0);
      const size = Number(searchParams.get('size') ?? 20);

      if (!Number.isInteger(page) || page < 0) {
        return invalidRequest('page는 0 이상의 정수여야 합니다.');
      }
      if (!Number.isInteger(size) || size < 1 || size > 100) {
        return invalidRequest('size는 1부터 100 사이의 정수여야 합니다.');
      }
      if (
        requestedStatus &&
        !['TODO', 'IN_PROGRESS', 'DONE'].includes(requestedStatus)
      ) {
        return invalidRequest('status 값이 올바르지 않습니다.');
      }

      const sectionRecords = adminMeetingRecordsFixture.filter(record =>
        matchesRequestedSection(record, sectionId),
      );
      const sectionFixtureIds = new Set(
        sectionRecords.map(record => record.sectionId),
      );
      const hasRequestedTeam =
        !requestedTeamId ||
        adminTeamsFixture.some(
          team =>
            sectionFixtureIds.has(team.sectionId) &&
            String(getAdminTeamId(team.id)) === requestedTeamId,
        );
      const hasRequestedMeetingRecord =
        !requestedMeetingRecordId ||
        sectionRecords.some(
          record =>
            String(getAdminMeetingRecordId(record)) ===
            requestedMeetingRecordId,
        );

      if (!hasRequestedTeam || !hasRequestedMeetingRecord) {
        return HttpResponse.json(
          {
            code: 'SECTION_ACTION_ACCESS_DENIED',
            message: '담당 분반의 액션플랜만 조회할 수 있습니다.',
          },
          { status: 403 },
        );
      }

      const actions = sectionRecords
        .flatMap(record => record.actions.map(action => ({ action, record })))
        .filter(
          ({ record }) =>
            !requestedTeamId || String(record.apiTeamId) === requestedTeamId,
        )
        .filter(
          ({ record }) =>
            !requestedMeetingRecordId ||
            String(getAdminMeetingRecordId(record)) ===
              requestedMeetingRecordId,
        )
        .filter(
          ({ action }) => !requestedStatus || action.status === requestedStatus,
        )
        .sort((left, right) => {
          const createdAtComparison = right.action.createdAt.localeCompare(
            left.action.createdAt,
          );

          return (
            createdAtComparison ||
            getAdminMeetingActionId(right.action.id) -
              getAdminMeetingActionId(left.action.id)
          );
        });
      const start = page * size;

      return HttpResponse.json({
        contents: actions
          .slice(start, start + size)
          .map(({ action, record }) => {
            const assignee = action.assignee
              ? adminStudentsFixture.find(
                  student => student.id === action.assignee?.userId,
                )
              : undefined;

            return {
              assigneeId:
                assignee?.studentNumber ?? action.assignee?.userId ?? null,
              assigneeName: action.assignee?.name ?? null,
              content: action.content,
              createdAt: formatFixtureDateTime(action.createdAt),
              dueAt: formatFixtureDateTime(action.dueDate),
              id: getAdminMeetingActionId(action.id),
              meetingAt: formatFixtureDateTime(record.heldAt),
              meetingRecordId: getAdminMeetingRecordId(record),
              meetingRecordTitle: record.title,
              status: action.status,
              teamId: record.apiTeamId,
              teamName: record.teamLabel,
              updatedAt: formatFixtureDateTime(action.updatedAt),
            };
          }),
        pageable: {
          isEnd: start + size >= actions.length,
          page,
          size,
          totalElements: actions.length,
          totalPages: Math.ceil(actions.length / size),
        },
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
      const milestoneId = searchParams.get('milestoneId');
      const page = Math.max(Number(searchParams.get('page') ?? 0), 0);
      const size = Math.min(
        Math.max(Number(searchParams.get('size') ?? 20), 1),
        100,
      );
      const records = adminMeetingRecordsFixture
        .filter(record =>
          isAccessibleRecordSection(record, accessibleSectionIds),
        )
        .filter(
          record =>
            !sectionId ||
            record.sectionId === sectionId ||
            String(record.apiSectionId) === sectionId,
        )
        .filter(record => !teamId || String(record.apiTeamId) === teamId)
        .filter(
          record =>
            !milestoneId || record.milestoneIds.includes(Number(milestoneId)),
        )
        .sort((left, right) => right.heldAt.localeCompare(left.heldAt));
      const start = page * size;

      return HttpResponse.json({
        contents: records.slice(start, start + size).map(record => ({
          authorId: record.createdBy.userId,
          content: getRichTextPlainText(record.content),
          id: getAdminMeetingRecordId(record),
          location: record.location,
          meetingAt: record.heldAt.slice(0, 16).replace('T', ' '),
          participantCount: record.participants.length,
          phase: record.phase,
          sectionId: record.apiSectionId,
          sectionName: record.sectionLabel,
          teamId: record.apiTeamId,
          teamName: record.teamLabel,
          title: record.title,
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
      const meetingId = Number(params.meetingId);
      if (!Number.isSafeInteger(meetingId)) return;

      const accessibleSectionIds = getAccessibleSectionIds(request);
      const record = Number.isSafeInteger(meetingId)
        ? adminMeetingRecordsFixture.find(
            item => getAdminMeetingRecordId(item) === meetingId,
          )
        : undefined;

      if (!accessibleSectionIds) {
        return HttpResponse.json(
          { code: 'UNAUTHORIZED', message: '관리자 로그인이 필요합니다.' },
          { status: 401 },
        );
      }

      if (!record || !isAccessibleRecordSection(record, accessibleSectionIds)) {
        return HttpResponse.json(
          { code: 'MEETING_NOT_FOUND', message: '회의록을 찾을 수 없습니다.' },
          { status: 404 },
        );
      }

      return HttpResponse.json({
        authorId: record.createdBy.userId,
        content: getRichTextPlainText(record.content),
        createdAt: record.createdAt.slice(0, 16).replace('T', ' '),
        id: getAdminMeetingRecordId(record),
        location: record.location,
        meetingAt: record.heldAt.slice(0, 16).replace('T', ' '),
        participantIds: record.participants.map(
          participant =>
            adminStudentsFixture.find(
              student => student.id === participant.userId,
            )?.studentNumber ?? participant.userId,
        ),
        phase: record.phase,
        sectionId: record.apiSectionId,
        sectionName: record.sectionLabel,
        teamId: record.apiTeamId,
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

      const requestedSectionIsAccessible =
        accessibleSectionIds.includes(sectionId) ||
        adminMeetingRecordsFixture.some(
          record =>
            matchesRequestedSection(record, sectionId) &&
            isAccessibleRecordSection(record, accessibleSectionIds),
        );

      if (!requestedSectionIsAccessible) {
        return HttpResponse.json(
          {
            code: 'FORBIDDEN',
            message: '담당 분반의 회의록만 조회할 수 있습니다.',
          },
          { status: 403 },
        );
      }

      const record = adminMeetingRecordsFixture.find(
        item =>
          item.id === meetingId && matchesRequestedSection(item, sectionId),
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

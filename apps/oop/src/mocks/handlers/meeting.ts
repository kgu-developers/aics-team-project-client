import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import {
  meetingActionStatuses,
  type CreateMeetingActionInput,
  type CreateMeetingRecordInput,
  type MeetingRecord,
  type UpdateMeetingActionInput,
  type UpdateMeetingRecordInput,
} from '@aics/core';
import { http, HttpResponse } from 'msw';

import { getMockAccessToken } from '../authSession';
import {
  createMeetingAction,
  createMeetingRecord,
  deleteMeetingRecord,
  getMeetingRecord,
  getMeetingRecordByActionId,
  getMeetingRecords,
  getTeamMeetingActions,
  isMeetingMemberId,
  updateMeetingAction,
  updateMeetingRecord,
} from '../data/meeting';
import { getDemoStudentAccount } from '../data/users';

const error = (code: string, status: number) =>
  HttpResponse.json({ code }, { status });
function guard(request: Request) {
  const account = getDemoStudentAccount(getMockAccessToken(request));
  if (!account) return { response: error('UNAUTHORIZED', 401) } as const;
  if (!account.user.currentTeam)
    return { response: error('TEAM_REQUIRED', 403) } as const;
  const member = account.user.currentTeam.members.find(
    candidate => candidate.id === account.user.id,
  );
  if (!member) return { response: error('TEAM_ACCESS_DENIED', 403) } as const;
  return {
    teamId: account.user.currentTeam.id,
    member,
    userId: account.user.id,
    author: {
      userId: account.user.id,
      name: account.user.name,
    },
  } as const;
}
function owned(request: Request, meetingId: string) {
  const result = guard(request);
  if ('response' in result) return result;
  const record = getMeetingRecord(meetingId);
  if (!record) return { response: error('MEETING_NOT_FOUND', 404) } as const;
  if (record.teamId !== result.teamId)
    return { response: error('TEAM_ACCESS_DENIED', 403) } as const;
  return { ...result, record } as const;
}
function validRecord(
  input: Partial<CreateMeetingRecordInput | UpdateMeetingRecordInput>,
  record?: MeetingRecord,
) {
  const actionIds = input.actions?.flatMap(action =>
    action.id ? [action.id] : [],
  );
  return Boolean(
    input.title?.trim() &&
    input.heldAt &&
    input.content?.type &&
    Array.isArray(input.participantUserIds) &&
    input.participantUserIds.length > 0 &&
    input.participantUserIds.every(isMeetingMemberId) &&
    Array.isArray(input.actions) &&
    input.actions.every(
      action =>
        action.content.trim() &&
        (!action.assigneeUserId || isMeetingMemberId(action.assigneeUserId)) &&
        (!action.id || record?.actions.some(item => item.id === action.id)),
    ) &&
    actionIds &&
    new Set(actionIds).size === actionIds.length,
  );
}
export const meetingHandlers = [
  http.get(
    `${API_BASE_URL}${ENDPOINTS.MEETING.ACTIONS(':teamId')}`,
    ({ params, request }) => {
      const result = guard(request);
      if ('response' in result) return result.response;
      return String(params.teamId) === result.teamId
        ? HttpResponse.json(getTeamMeetingActions(result.teamId))
        : error('TEAM_ACCESS_DENIED', 403);
    },
  ),
  http.get(
    `${API_BASE_URL}${ENDPOINTS.MEETING.RECORDS(':teamId')}`,
    ({ params, request }) => {
      const result = guard(request);
      if ('response' in result) return result.response;
      return String(params.teamId) === result.teamId
        ? HttpResponse.json(getMeetingRecords(result.teamId))
        : error('TEAM_ACCESS_DENIED', 403);
    },
  ),
  http.post(
    `${API_BASE_URL}${ENDPOINTS.MEETING.RECORDS(':teamId')}`,
    async ({ params, request }) => {
      const result = guard(request);
      if ('response' in result) return result.response;
      if (String(params.teamId) !== result.teamId)
        return error('TEAM_ACCESS_DENIED', 403);
      const input = (await request.json()) as CreateMeetingRecordInput;
      return validRecord(input)
        ? HttpResponse.json(
            createMeetingRecord(result.teamId, result.author, input),
            { status: 201 },
          )
        : error('INVALID_MEETING_RECORD', 400);
    },
  ),
  http.get(
    `${API_BASE_URL}${ENDPOINTS.MEETING.RECORD(':meetingId')}`,
    ({ params, request }) => {
      const result = owned(request, String(params.meetingId));
      return 'response' in result
        ? result.response
        : HttpResponse.json((result as { record: MeetingRecord }).record);
    },
  ),
  http.put(
    `${API_BASE_URL}${ENDPOINTS.MEETING.RECORD(':meetingId')}`,
    async ({ params, request }) => {
      const result = owned(request, String(params.meetingId));
      if ('response' in result) return result.response;
      const input = (await request.json()) as UpdateMeetingRecordInput;
      const record = (result as { record: MeetingRecord }).record;
      if (!validRecord(input, record))
        return error('INVALID_MEETING_RECORD', 400);
      return HttpResponse.json(updateMeetingRecord(record.id, input));
    },
  ),
  http.delete(
    `${API_BASE_URL}${ENDPOINTS.MEETING.RECORD(':meetingId')}`,
    ({ params, request }) => {
      const result = owned(request, String(params.meetingId));
      if ('response' in result) return result.response;
      const record = (result as { record: MeetingRecord }).record;
      if (record.createdBy.userId !== result.userId && !result.member.isLeader)
        return error('MEETING_DELETE_FORBIDDEN', 403);
      return deleteMeetingRecord(record.id)
        ? new HttpResponse(null, { status: 204 })
        : error('MEETING_NOT_FOUND', 404);
    },
  ),
  http.post(
    `${API_BASE_URL}${ENDPOINTS.MEETING.RECORD_ACTIONS(':meetingId')}`,
    async ({ params, request }) => {
      const result = owned(request, String(params.meetingId));
      if ('response' in result) return result.response;
      const input = (await request.json()) as CreateMeetingActionInput;
      if (
        !input.content?.trim() ||
        (input.assigneeUserId && !isMeetingMemberId(input.assigneeUserId))
      )
        return error('INVALID_MEETING_ACTION', 400);
      const record = (result as { record: MeetingRecord }).record;
      return HttpResponse.json(createMeetingAction(record.id, input), {
        status: 201,
      });
    },
  ),
  http.patch(
    `${API_BASE_URL}${ENDPOINTS.MEETING.ACTION(':actionId')}`,
    async ({ params, request }) => {
      const actionId = String(params.actionId);
      const meeting = getMeetingRecordByActionId(actionId);
      if (!meeting) return error('MEETING_ACTION_NOT_FOUND', 404);
      const result = owned(request, meeting.id);
      if ('response' in result) return result.response;
      const input = (await request.json()) as UpdateMeetingActionInput;
      if (
        (input.content !== undefined && !input.content.trim()) ||
        (input.assigneeUserId && !isMeetingMemberId(input.assigneeUserId)) ||
        (input.status !== undefined &&
          !meetingActionStatuses.includes(input.status))
      )
        return error('INVALID_MEETING_ACTION', 400);
      return HttpResponse.json(
        updateMeetingAction(meeting.id, actionId, input),
      );
    },
  ),
];

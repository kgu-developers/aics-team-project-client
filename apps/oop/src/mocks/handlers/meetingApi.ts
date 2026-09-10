import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import {
  meetingPhases,
  meetingApiActionStatuses,
  type MeetingRecordCreateRequest,
  type MeetingActionCreateRequest,
  type MeetingActionUpdateRequest,
  type TeamMeetingActionResponseDto,
} from '@aics/core';
import { http, HttpResponse } from 'msw';

import { getMockAuthenticatedAccount } from '../authSession';
import {
  meetingApiAction,
  meetingApiRecord,
  meetingApiTeam,
} from '../data/meetingApi';

// Numeric server-contract fixtures coexist with the legacy demo's named IDs.
export function createMeetingApiHandlers() {
  let records = [structuredClone(meetingApiRecord)];
  let actions = [structuredClone(meetingApiAction)];
  let nextRecordId = 20;
  let nextActionId = 42;
  const fail = (status: number) =>
    HttpResponse.json(
      { code: status === 403 ? 'FORBIDDEN' : 'INVALID_REQUEST' },
      { status },
    );
  const guard = (request: Request, teamId = '7') => {
    const account = getMockAuthenticatedAccount(request);
    if (!account) return fail(401);
    if (
      teamId !== '7' ||
      !meetingApiTeam.members.some(
        member => member.studentNumber === account.user.studentNumber,
      )
    )
      return fail(403);
    return undefined;
  };
  const member = (id: string) =>
    meetingApiTeam.members.find(item => item.studentNumber === id);
  const recordPath = `${API_BASE_URL}/meeting-records/:id(\\d+)`;
  const now = () => new Date().toISOString().slice(0, 16).replace('T', ' ');
  const validDueAt = (value: string | undefined) =>
    value === undefined || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value);
  const assignee = (id?: string) => {
    const found = id ? member(id) : undefined;
    return found
      ? { userId: found.studentNumber, name: found.name || found.studentNumber }
      : null;
  };
  const dueAt = (value: string) => value.replace('T', ' ').slice(0, 16);
  return [
    http.get(
      `${API_BASE_URL}/teams/:teamId(\\d+)/actions`,
      ({ request, params }) => {
        const denied = guard(request, String(params.teamId));
        if (denied) return denied;
        const status = new URL(request.url).searchParams.get('status');
        if (status && !meetingApiActionStatuses.some(value => value === status))
          return fail(400);
        const contents: TeamMeetingActionResponseDto[] = actions
          .filter(action => !status || action.status === status)
          .map(action => {
            const record = records.find(
              item => item.id === action.meetingRecordId,
            )!;
            return {
              ...action,
              meetingRecord: { id: record.id, title: record.title },
            };
          });
        return HttpResponse.json({ contents });
      },
    ),
    http.get(
      `${API_BASE_URL}${ENDPOINTS.TEAM.KICKOFF(':teamId')}`,
      ({ request, params }) => {
        const denied = guard(request, String(params.teamId));
        if (denied) return denied;
        return HttpResponse.json(meetingApiTeam);
      },
    ),
    http.get(
      `${API_BASE_URL}${ENDPOINTS.PROJECT.BY_TEAM(':teamId')}`,
      ({ request, params }) => {
        const denied = guard(request, String(params.teamId));
        if (denied) return denied;
        return HttpResponse.json(
          { code: 'PROJECT_NOT_FOUND' },
          { status: 404 },
        );
      },
    ),
    http.get(
      `${API_BASE_URL}/teams/:teamId(\\d+)/meeting-records`,
      ({ request, params }) => {
        const denied = guard(request, String(params.teamId));
        if (denied) return denied;
        const phase = new URL(request.url).searchParams.get('phase');
        return HttpResponse.json({
          contents: records
            .filter(record => !phase || record.phase === phase)
            .map(record => ({
              ...record,
              participantCount: record.participantIds.length,
            })),
        });
      },
    ),
    http.post(
      `${API_BASE_URL}/teams/:teamId(\\d+)/meeting-records`,
      async ({ request, params }) => {
        const denied = guard(request, String(params.teamId));
        if (denied) return denied;
        const input = (await request.json()) as MeetingRecordCreateRequest;
        if (
          !input.title?.trim() ||
          !input.content?.trim() ||
          !input.meetingAt ||
          !meetingPhases.includes(input.phase) ||
          input.participantIds?.some(id => !member(id))
        )
          return fail(400);
        const record = {
          ...input,
          participantIds: input.participantIds ?? [],
          id: nextRecordId++,
          teamId: 7,
          authorId: getMockAuthenticatedAccount(request)!.user.studentNumber,
          createdAt: now(),
          updatedAt: now(),
        };
        records.push(record);
        return HttpResponse.json(record, { status: 201 });
      },
    ),
    http.get(recordPath, ({ request, params }) => {
      const denied = guard(request);
      if (denied) return denied;
      const record = records.find(item => item.id === Number(params.id));
      return record ? HttpResponse.json(record) : fail(404);
    }),
    http.delete(recordPath, ({ request, params }) => {
      const denied = guard(request);
      if (denied) return denied;
      const id = Number(params.id);
      if (!records.some(item => item.id === id)) return fail(404);
      records = records.filter(item => item.id !== id);
      actions = actions.filter(item => item.meetingRecordId !== id);
      return new HttpResponse(null, { status: 204 });
    }),
    http.get(`${recordPath}/actions`, ({ request, params }) => {
      const denied = guard(request);
      if (denied) return denied;
      if (!records.some(item => item.id === Number(params.id)))
        return fail(404);
      return HttpResponse.json({
        contents: actions.filter(
          action => action.meetingRecordId === Number(params.id),
        ),
      });
    }),
    http.post(`${recordPath}/actions`, async ({ request, params }) => {
      const denied = guard(request);
      if (denied) return denied;
      const recordId = Number(params.id);
      if (!records.some(record => record.id === recordId)) return fail(404);
      const input = (await request.json()) as MeetingActionCreateRequest;
      if (
        !input.content?.trim() ||
        !validDueAt(input.dueAt) ||
        (input.assigneeId !== undefined && !member(input.assigneeId))
      )
        return fail(400);
      const action = {
        id: nextActionId++,
        meetingRecordId: recordId,
        content: input.content,
        status: 'TODO' as const,
        assignee: assignee(input.assigneeId),
        dueAt: input.dueAt ? dueAt(input.dueAt) : null,
        createdAt: now(),
        updatedAt: now(),
      };
      actions.push(action);
      return HttpResponse.json(action, { status: 201 });
    }),
    http.delete(
      `${API_BASE_URL}/meeting-actions/:id(\\d+)`,
      ({ request, params }) => {
        const denied = guard(request);
        if (denied) return denied;
        const id = Number(params.id);
        if (!actions.some(action => action.id === id))
          return HttpResponse.json(
            { code: 'MEETING_ACTION_NOT_FOUND' },
            { status: 404 },
          );
        actions = actions.filter(action => action.id !== id);
        return new HttpResponse(null, { status: 204 });
      },
    ),
    http.patch(
      `${API_BASE_URL}/meeting-actions/:id(\\d+)`,
      async ({ request, params }) => {
        const denied = guard(request);
        if (denied) return denied;
        const action = actions.find(item => item.id === Number(params.id));
        if (!action) return fail(404);
        const input = (await request.json()) as MeetingActionUpdateRequest;
        if (
          (input.content !== undefined && !input.content.trim()) ||
          (input.status !== undefined &&
            !meetingApiActionStatuses.includes(input.status)) ||
          !validDueAt(input.dueAt) ||
          (!input.clearAssignee &&
            input.assigneeId !== undefined &&
            !member(input.assigneeId))
        )
          return fail(400);
        if (input.content !== undefined) action.content = input.content;
        if (input.status !== undefined) action.status = input.status;
        if (input.clearAssignee) action.assignee = null;
        else if (input.assigneeId !== undefined)
          action.assignee = assignee(input.assigneeId);
        if (input.clearDueAt) action.dueAt = null;
        else if (input.dueAt !== undefined) action.dueAt = dueAt(input.dueAt);
        action.updatedAt = now();
        return HttpResponse.json(action);
      },
    ),
  ];
}

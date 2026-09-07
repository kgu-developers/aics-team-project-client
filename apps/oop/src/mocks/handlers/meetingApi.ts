import { API_BASE_URL } from '@aics/api-client';
import { meetingPhases, type MeetingRecordCreateRequest } from '@aics/core';
import { http, HttpResponse } from 'msw';

import { getMockAccessToken } from '../authSession';
import {
  meetingApiAction,
  meetingApiRecord,
  meetingApiTeam,
} from '../data/meetingApi';
import { getDemoStudentAccount } from '../data/users';

// Numeric server-contract fixtures coexist with the legacy demo's named IDs.
export function createMeetingApiHandlers() {
  let records = [structuredClone(meetingApiRecord)];
  let actions = [structuredClone(meetingApiAction)];
  let nextRecordId = 20;
  const fail = (status: number) =>
    HttpResponse.json(
      { code: status === 403 ? 'FORBIDDEN' : 'INVALID_REQUEST' },
      { status },
    );
  const guard = (request: Request, teamId = '7') => {
    const account = getDemoStudentAccount(getMockAccessToken(request));
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
  return [
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
          authorId: getDemoStudentAccount(getMockAccessToken(request))!.user
            .studentNumber,
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
  ];
}

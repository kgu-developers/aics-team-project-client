import {
  API_BASE_URL,
  fetchMeetingActionEntries,
  fetchMeetingRecordDetail,
  fetchMeetingRecordSummaries,
  fetchTeamMeetingActionEntries,
  removeMeetingRecordApi,
  submitMeetingActionApi,
  submitMeetingRecordApi,
  updateMeetingActionApi,
  updateMeetingRecordApi,
} from '@aics/api-client';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

const meetingRecordSummaryDto = {
  id: 7,
  title: '진행 점검',
  phase: 'MID_CHECK' as const,
  meetingAt: '2026-08-03 14:00',
  authorId: '202600001',
  participantCount: 3,
};

const meetingRecordDetailDto = {
  id: 7,
  title: '진행 점검',
  teamId: 10,
  phase: 'MID_CHECK' as const,
  authorId: '202600001',
  meetingAt: '2026-08-03 14:00',
  content: '진행 상황 공유',
  participantIds: ['202600001', '202600002'],
  createdAt: '2026-08-01 10:00',
  updatedAt: '2026-08-02 09:30',
};

const meetingRecordPersistDto = {
  id: 7,
  title: '진행 점검',
  phase: 'MID_CHECK' as const,
  meetingAt: '2026-08-03 14:00',
  authorId: '202600001',
};

const meetingActionDto = {
  id: 11,
  meetingRecordId: 7,
  content: 'API 명세서 작성',
  status: 'TODO' as const,
  createdAt: '2026-09-07 13:00',
  updatedAt: '2026-09-07 13:00',
};

const requestBodies: unknown[] = [];
const deleteRequest = vi.fn();

const server = setupServer(
  http.get(`${API_BASE_URL}/teams/:teamId/meeting-records`, ({ request }) => {
    expect(new URL(request.url).searchParams.get('phase')).toBe('MID_CHECK');
    return HttpResponse.json({ contents: [meetingRecordSummaryDto] });
  }),
  http.post(
    `${API_BASE_URL}/teams/:teamId/meeting-records`,
    async ({ request }) => {
      requestBodies.push(await request.json());
      return HttpResponse.json(meetingRecordPersistDto, { status: 201 });
    },
  ),
  http.get(`${API_BASE_URL}/meeting-records/:id`, () =>
    HttpResponse.json(meetingRecordDetailDto),
  ),
  http.patch(`${API_BASE_URL}/meeting-records/:id`, async ({ request }) => {
    requestBodies.push(await request.json());
    return HttpResponse.json(meetingRecordPersistDto);
  }),
  http.delete(`${API_BASE_URL}/meeting-records/:id`, () => {
    deleteRequest();
    return new HttpResponse(null, { status: 204 });
  }),
  http.get(`${API_BASE_URL}/meeting-records/:id/actions`, () =>
    HttpResponse.json({ contents: [meetingActionDto] }),
  ),
  http.post(
    `${API_BASE_URL}/meeting-records/:id/actions`,
    async ({ request }) => {
      requestBodies.push(await request.json());
      return HttpResponse.json(meetingActionDto, { status: 201 });
    },
  ),
  http.patch(`${API_BASE_URL}/meeting-actions/:id`, async ({ request }) => {
    requestBodies.push(await request.json());
    return HttpResponse.json({ ...meetingActionDto, status: 'DONE' });
  }),
  http.get(`${API_BASE_URL}/teams/:teamId/actions`, ({ request }) => {
    expect(new URL(request.url).searchParams.get('status')).toBe('DONE');
    return HttpResponse.json({
      contents: [
        { ...meetingActionDto, meetingRecord: { id: 7, title: '진행 점검' } },
      ],
    });
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  requestBodies.length = 0;
  deleteRequest.mockClear();
  server.resetHandlers();
});
afterAll(() => server.close());

describe('meeting API client contract', () => {
  it('회의록 목록 envelope와 상세 응답을 서버 필드만으로 변환한다', async () => {
    const summaries = await fetchMeetingRecordSummaries('10', 'MID_CHECK');
    const detail = await fetchMeetingRecordDetail('7');

    expect(summaries).toEqual([
      {
        ...meetingRecordSummaryDto,
        id: '7',
        location: null,
      },
    ]);
    expect(detail).toEqual({
      ...meetingRecordDetailDto,
      id: '7',
      location: null,
      teamId: '10',
    });
  });

  it('회의록 생성·수정·삭제를 POST·PATCH·DELETE 계약으로 호출한다', async () => {
    const created = await submitMeetingRecordApi('10', {
      title: '진행 점검',
      meetingAt: '2026-08-03T14:00:00',
      phase: 'MID_CHECK',
      content: '진행 상황 공유',
      participantIds: ['202600001', '202600002'],
    });
    const updated = await updateMeetingRecordApi('7', {
      content: '수정된 진행 상황',
      phase: 'FINAL',
    });
    await removeMeetingRecordApi('7');

    expect(requestBodies).toEqual([
      {
        title: '진행 점검',
        meetingAt: '2026-08-03T14:00:00',
        phase: 'MID_CHECK',
        content: '진행 상황 공유',
        participantIds: ['202600001', '202600002'],
      },
      { content: '수정된 진행 상황', phase: 'FINAL' },
    ]);
    expect(created).toEqual({
      ...meetingRecordPersistDto,
      id: '7',
      location: null,
    });
    expect(updated).toEqual(created);
    expect(deleteRequest).toHaveBeenCalledOnce();
  });

  it('회의별·팀별 액션 조회와 POST·PATCH 응답을 실제 envelope로 처리한다', async () => {
    const meetingActions = await fetchMeetingActionEntries('7');
    const teamActions = await fetchTeamMeetingActionEntries('10', 'DONE');
    const created = await submitMeetingActionApi('7', {
      content: 'API 명세서 작성',
    });
    const updated = await updateMeetingActionApi('11', {
      status: 'DONE',
      clearDueAt: true,
    });

    const expectedAction = {
      ...meetingActionDto,
      assignee: null,
      dueAt: null,
      id: '11',
      meetingRecordId: '7',
    };
    expect(meetingActions).toEqual([expectedAction]);
    expect(teamActions).toEqual([
      { ...expectedAction, meetingRecord: { id: '7', title: '진행 점검' } },
    ]);
    expect(created).toEqual(expectedAction);
    expect(updated).toEqual({ ...expectedAction, status: 'DONE' });
    expect(requestBodies).toEqual([
      { content: 'API 명세서 작성' },
      { status: 'DONE', clearDueAt: true },
    ]);
  });
});

describe('meeting API contract boundaries', () => {
  it('필터가 없으면 쿼리 파라미터를 생략하고 빈 contents를 빈 목록으로 반환한다', async () => {
    server.use(
      http.get(`${API_BASE_URL}/teams/10/meeting-records`, ({ request }) => {
        expect(new URL(request.url).search).toBe('');
        return HttpResponse.json({ contents: [] });
      }),
      http.get(`${API_BASE_URL}/teams/10/actions`, ({ request }) => {
        expect(new URL(request.url).search).toBe('');
        return HttpResponse.json({ contents: [] });
      }),
      http.get(`${API_BASE_URL}/meeting-records/7/actions`, () =>
        HttpResponse.json({ contents: [] }),
      ),
    );

    await expect(fetchMeetingRecordSummaries('10')).resolves.toEqual([]);
    await expect(fetchTeamMeetingActionEntries('10')).resolves.toEqual([]);
    await expect(fetchMeetingActionEntries('7')).resolves.toEqual([]);
  });

  it('TODO 상태와 담당자 학번·서버 시각 문자열을 손실 없이 전달한다', async () => {
    server.use(
      http.get(`${API_BASE_URL}/teams/10/actions`, ({ request }) => {
        expect(new URL(request.url).searchParams.get('status')).toBe('TODO');
        return HttpResponse.json({
          contents: [
            {
              ...meetingActionDto,
              meetingRecord: { id: 7, title: null },
              status: 'TODO',
              assignee: { userId: '020260001', name: '테스트 담당자' },
              dueAt: '2026-08-28 18:00',
            },
          ],
        });
      }),
    );

    await expect(fetchTeamMeetingActionEntries('10', 'TODO')).resolves.toEqual([
      {
        ...meetingActionDto,
        id: '11',
        meetingRecordId: '7',
        meetingRecord: { id: '7', title: null },
        status: 'TODO',
        assignee: { userId: '020260001', name: '테스트 담당자' },
        dueAt: '2026-08-28 18:00',
      },
    ]);
  });

  it('PATCH의 빈 참석자 목록과 명시적인 해제 플래그를 생략하지 않는다', async () => {
    await updateMeetingRecordApi('7', { participantIds: [], location: '' });
    await updateMeetingActionApi('11', {
      clearAssignee: true,
      clearDueAt: false,
      dueAt: '2026-08-29T12:00:00',
    });

    expect(requestBodies).toEqual([
      { participantIds: [], location: '' },
      { clearAssignee: true, clearDueAt: false, dueAt: '2026-08-29T12:00:00' },
    ]);
  });

  it.each([
    ['회의록 목록', () => fetchMeetingRecordSummaries('10')],
    ['회의록 상세', () => fetchMeetingRecordDetail('7')],
    ['회의별 액션', () => fetchMeetingActionEntries('7')],
    ['팀별 액션', () => fetchTeamMeetingActionEntries('10')],
    [
      '회의록 생성',
      () =>
        submitMeetingRecordApi('10', {
          title: '진행 점검',
          meetingAt: '2026-08-03T14:00:00',
          phase: 'MID_CHECK',
          content: '회의 내용',
        }),
    ],
    ['회의록 수정', () => updateMeetingRecordApi('7', { content: '수정' })],
    ['회의록 삭제', () => removeMeetingRecordApi('7')],
    ['액션 생성', () => submitMeetingActionApi('7', { content: '작업' })],
    ['액션 수정', () => updateMeetingActionApi('11', { status: 'TODO' })],
  ])('%s 권한 오류를 성공 응답으로 바꾸지 않는다', async (_name, request) => {
    server.use(
      http.all('*', () =>
        HttpResponse.json({ code: 'FORBIDDEN' }, { status: 403 }),
      ),
    );
    await expect(request()).rejects.toMatchObject({
      response: { status: 403 },
    });
  });
});

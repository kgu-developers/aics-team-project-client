import {
  API_BASE_URL,
  claimTeamLeader,
  fetchTeamKickoff,
  fetchTeamMemberContacts,
} from '@aics/api-client';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, expect, it } from 'vitest';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

it('kickoff 멤버 ID와 연락처 학번을 구분하고 contents를 반환한다', async () => {
  server.use(
    http.get(`${API_BASE_URL}/api/v1/oop/teams/4/kickoff`, () =>
      HttpResponse.json({
        id: 4,
        name: '7조',
        members: [{ id: 10, studentNumber: '20260001', isLeader: false }],
      }),
    ),
    http.get(`${API_BASE_URL}/api/v1/oop/teams/4/members/contacts`, () =>
      HttpResponse.json({
        contents: [
          {
            studentNumber: '20260001',
            phone: '010-0000-0000',
            isLeader: false,
          },
        ],
      }),
    ),
  );
  expect((await fetchTeamKickoff('4')).members[0]).toEqual({
    id: 10,
    studentNumber: '20260001',
    isLeader: false,
  });
  expect(await fetchTeamMemberContacts('4')).toEqual([
    { studentNumber: '20260001', phone: '010-0000-0000', isLeader: false },
  ]);
});
it('안전 정수 최댓값의 kickoff ID는 정확하게 유지한다', async () => {
  const teamId = '9007199254740991';
  server.use(
    http.get(`${API_BASE_URL}/api/v1/oop/teams/${teamId}/kickoff`, () =>
      HttpResponse.json({
        id: Number(teamId),
        name: '7조',
        members: [
          { id: Number(teamId), studentNumber: '20260001', isLeader: false },
        ],
      }),
    ),
  );
  const result = await fetchTeamKickoff(teamId);
  expect(String(result.id)).toBe(teamId);
  expect(String(result.members[0]?.id)).toBe(teamId);
});

it.each([
  ['9007199254740993', '10'],
  ['4', '9007199254740993'],
])(
  '정확하게 표현할 수 없는 kickoff ID(%s, %s)는 응답을 거부한다',
  async (teamId, memberId) => {
    server.use(
      http.get(
        `${API_BASE_URL}/api/v1/oop/teams/4/kickoff`,
        () =>
          new HttpResponse(
            `{"id":${teamId},"name":"7조","members":[{"id":${memberId},"studentNumber":"20260001","isLeader":false}]}`,
            { headers: { 'Content-Type': 'application/json' } },
          ),
      ),
    );
    await expect(fetchTeamKickoff('4')).rejects.toThrow(
      '팀 식별자를 정확하게 확인할 수 없습니다.',
    );
  },
);

it('팀장 선점은 본문 없이 POST하고 204를 처리한다', async () => {
  server.use(
    http.post(
      `${API_BASE_URL}/api/v1/oop/teams/4/leader-claim`,
      async ({ request }) => {
        expect(await request.text()).toBe('');
        return new HttpResponse(null, { status: 204 });
      },
    ),
  );
  await expect(claimTeamLeader({ teamId: '4' })).resolves.toBeUndefined();
});
it.each([401, 403, 409])(
  '팀장 선점 %s는 성공으로 취급하지 않는다',
  async status => {
    server.use(
      http.post(
        `${API_BASE_URL}/api/v1/oop/teams/4/leader-claim`,
        () => new HttpResponse(null, { status }),
      ),
    );
    await expect(claimTeamLeader({ teamId: '4' })).rejects.toMatchObject({
      response: { status },
    });
  },
);

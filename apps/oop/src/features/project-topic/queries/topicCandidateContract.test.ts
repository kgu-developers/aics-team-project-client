import {
  API_BASE_URL,
  fetchTopicCandidates,
  removeTopicCandidateVote,
  submitTeamTopicCandidate,
  submitTopicCandidateVote,
} from '@aics/api-client';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

const server = setupServer();
const candidatesUrl = `${API_BASE_URL}/api/v1/teams/4/topic-candidates`;
const candidate = {
  id: 17,
  proposerUserId: '20260001',
  title: '일정 관리',
  description: '팀 일정을 관리합니다.',
};
const listed = { ...candidate, voteCount: 3, votedByMe: false };
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('학생 주제 후보 HTTP 계약', () => {
  it('contents를 풀어 학번·숫자 ID·득표 수·본인 투표를 보존한다', async () => {
    server.use(
      http.get(candidatesUrl, () => HttpResponse.json({ contents: [listed] })),
    );
    expect(await fetchTopicCandidates('4')).toEqual([listed]);
  });
  it('팀 후보 생성은 제목·설명을 전송하고 201 단일 후보를 받는다', async () => {
    server.use(
      http.post(candidatesUrl, async ({ request }) => {
        expect(await request.json()).toEqual({
          title: candidate.title,
          description: candidate.description,
        });
        return HttpResponse.json(candidate, { status: 201 });
      }),
    );
    expect(
      await submitTeamTopicCandidate('4', {
        title: ` ${candidate.title} `,
        description: ` ${candidate.description} `,
      }),
    ).toEqual(candidate);
  });
  it('투표는 후보 경로에 본문 없이 POST하고 201 투표 응답을 받는다', async () => {
    server.use(
      http.post(
        `${API_BASE_URL}/api/v1/topic-candidates/17/vote`,
        async ({ request }) => {
          expect(await request.text()).toBe('');
          return HttpResponse.json(
            { id: 18, candidateId: 17, voterUserId: '20260001' },
            { status: 201 },
          );
        },
      ),
    );
    expect(await submitTopicCandidateVote('17')).toEqual({
      id: 18,
      candidateId: 17,
      voterUserId: '20260001',
    });
  });
  it('취소는 현재 후보 경로의 DELETE 204를 빈 응답으로 처리한다', async () => {
    server.use(
      http.delete(
        `${API_BASE_URL}/api/v1/topic-candidates/17/vote`,
        async ({ request }) => {
          expect(await request.text()).toBe('');
          return new HttpResponse(null, { status: 204 });
        },
      ),
    );
    expect(await removeTopicCandidateVote('17')).toBeUndefined();
  });
  it.each(['', '0', '-1', '1.2', '../4', '9007199254740993'])(
    '유효하지 않은 식별자 %s는 네트워크 전에 거절한다',
    async id => {
      await expect(fetchTopicCandidates(id)).rejects.toThrow('식별자');
      await expect(submitTeamTopicCandidate(id, candidate)).rejects.toThrow(
        '식별자',
      );
      await expect(submitTopicCandidateVote(id)).rejects.toThrow('식별자');
      await expect(removeTopicCandidateVote(id)).rejects.toThrow('식별자');
    },
  );
  it.each([
    { title: '', description: '설명' },
    { title: '제목', description: ' ' },
    { title: '제'.repeat(201), description: '설명' },
  ])('빈 입력 또는 200자를 넘는 제목은 전송하지 않는다', async input => {
    await expect(submitTeamTopicCandidate('4', input)).rejects.toThrow('200자');
  });
  it.each([
    { id: Number.MAX_SAFE_INTEGER + 1 },
    { voteCount: -1 },
    { votedByMe: 'false' },
    { proposerUserId: '' },
  ])('모호한 응답으로 후보 ID·본인 표시를 만들지 않는다: %o', async invalid => {
    server.use(
      http.get(candidatesUrl, () =>
        HttpResponse.json({ contents: [{ ...listed, ...invalid }] }),
      ),
    );
    await expect(fetchTopicCandidates('4')).rejects.toThrow(
      '확인할 수 없습니다',
    );
  });
  it.each([401, 403, 409, 500])(
    '%s 오류를 성공 응답으로 취급하지 않는다',
    async status => {
      server.use(
        http.post(candidatesUrl, () => new HttpResponse(null, { status })),
      );
      await expect(
        submitTeamTopicCandidate('4', candidate),
      ).rejects.toMatchObject({ response: { status } });
    },
  );
  it('다른 후보의 투표 응답을 성공으로 받아들이지 않는다', async () => {
    server.use(
      http.post(`${API_BASE_URL}/api/v1/topic-candidates/17/vote`, () =>
        HttpResponse.json(
          { id: 18, candidateId: 19, voterUserId: '20260001' },
          { status: 201 },
        ),
      ),
    );
    await expect(submitTopicCandidateVote('17')).rejects.toThrow(
      '확인할 수 없습니다',
    );
  });
});

import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { http, HttpResponse } from 'msw';

import {
  addTopicCandidate,
  cancelTopicVote,
  changeTopicVote,
  demoTopicSectionId,
  getTopicBoard,
  hasTopicCandidate,
} from '../data/topic';
import { getDemoStudentAccount } from '../data/users';

function getAccessToken(request: Request) {
  return request.headers.get('authorization')?.replace('Bearer ', '') ?? null;
}

function guard(request: Request, sectionId: string) {
  const account = getDemoStudentAccount(getAccessToken(request));
  if (!account) {
    return {
      response: HttpResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 }),
    };
  }
  if (sectionId !== demoTopicSectionId) {
    return {
      response: HttpResponse.json(
        { code: 'TEAM_ACCESS_DENIED' },
        { status: 403 },
      ),
    };
  }
  const currentUserId =
    account.user.studentNumber === '20260001'
      ? 'student-a'
      : account.user.studentNumber === '20260003'
        ? 'student-b'
        : 'student-c';
  return { account, currentUserId };
}

function selectionFinalized() {
  return HttpResponse.json(
    {
      code: 'TOPIC_SELECTION_FINALIZED',
      message: '선정이 끝난 주제 후보와 투표는 변경할 수 없어요.',
    },
    { status: 409 },
  );
}

export const topicHandlers = [
  http.get(
    `${API_BASE_URL}${ENDPOINTS.TOPIC.BOARD(':sectionId')}`,
    ({ params, request }) => {
      const result = guard(request, String(params.sectionId));
      if ('response' in result) return result.response;
      return HttpResponse.json(getTopicBoard(result.currentUserId));
    },
  ),
  http.post(
    `${API_BASE_URL}${ENDPOINTS.TOPIC.BOARD(':sectionId')}`,
    async ({ params, request }) => {
      const result = guard(request, String(params.sectionId));
      if ('response' in result) return result.response;
      if (getTopicBoard(result.currentUserId).selection.status === 'SELECTED')
        return selectionFinalized();
      const input = (await request.json()) as {
        title?: string;
        description?: string;
      };
      if (!input.title?.trim() || !input.description?.trim()) {
        return HttpResponse.json(
          { code: 'INVALID_CANDIDATE' },
          { status: 400 },
        );
      }
      return HttpResponse.json(
        addTopicCandidate(result.currentUserId, result.account.user.name, {
          title: input.title,
          description: input.description,
        }),
      );
    },
  ),
  http.put(
    `${API_BASE_URL}${ENDPOINTS.TOPIC.VOTE(':sectionId')}`,
    async ({ params, request }) => {
      const result = guard(request, String(params.sectionId));
      if ('response' in result) return result.response;
      if (getTopicBoard(result.currentUserId).selection.status === 'SELECTED')
        return selectionFinalized();
      const { candidateId } = (await request.json()) as {
        candidateId?: string;
      };
      const candidate = getTopicBoard(result.currentUserId).candidates.find(
        item => item.id === candidateId,
      );
      if (!candidateId || !candidate || !hasTopicCandidate(candidateId)) {
        return HttpResponse.json(
          { code: 'CANDIDATE_NOT_FOUND' },
          { status: 404 },
        );
      }
      if (candidate.isMine) {
        return HttpResponse.json(
          { code: 'SELF_VOTE_NOT_ALLOWED' },
          { status: 403 },
        );
      }
      return HttpResponse.json(
        changeTopicVote(result.currentUserId, candidateId),
      );
    },
  ),
  http.delete(
    `${API_BASE_URL}${ENDPOINTS.TOPIC.VOTE(':sectionId')}`,
    ({ params, request }) => {
      const result = guard(request, String(params.sectionId));
      if ('response' in result) return result.response;
      if (getTopicBoard(result.currentUserId).selection.status === 'SELECTED')
        return selectionFinalized();
      return HttpResponse.json(cancelTopicVote(result.currentUserId));
    },
  ),
];

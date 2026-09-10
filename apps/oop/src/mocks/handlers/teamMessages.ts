import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import {
  teamMessageRelatedTypes,
  type SubmitTeamMessageInput,
  type TeamMessagePersistResponse,
  type TeamMessageRelatedType,
} from '@aics/core';
import { http, HttpResponse } from 'msw';

import { getMockAuthenticatedAccount } from '../authSession';
import {
  createTeamMessageData,
  teamMessageSenderNames,
} from '../data/teamMessages';

type TeamMessageHandlerOptions = {
  getAuthenticatedUserId?: (request: Request) => string | undefined;
};

function error(status: number, code: string) {
  return HttpResponse.json({ code }, { status });
}

function isRelatedType(value: unknown): value is TeamMessageRelatedType {
  return teamMessageRelatedTypes.some(type => type === value);
}

function isId(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

export function createTeamMessageHandlers(
  options: TeamMessageHandlerOptions = {},
) {
  const data = createTeamMessageData();
  const authenticatedUserId =
    options.getAuthenticatedUserId ??
    ((request: Request) =>
      getMockAuthenticatedAccount(request)?.user.studentNumber);
  const now = () => new Date().toISOString().slice(0, 16).replace('T', ' ');

  function guard(request: Request, teamId: string) {
    const userId = authenticatedUserId(request);
    if (!userId) return { response: new HttpResponse(null, { status: 401 }) };
    if (!/^\d+$/.test(teamId) || !isId(Number(teamId)))
      return { response: error(400, 'INVALID_REQUEST') };
    const team = data.teams.find(team => team.id === Number(teamId));
    if (
      !team ||
      (!team.memberIds.includes(userId) && team.professorId !== userId)
    ) {
      return {
        response: HttpResponse.json(
          {
            code: 'ACCESS_DENIED',
            message:
              '해당 팀에 소속된 사용자 또는 담당 교수만 접근할 수 있습니다.',
          },
          { status: 403 },
        ),
      };
    }
    return { userId, team };
  }

  function getOrCreateThread(teamId: number) {
    let thread = data.threads.find(thread => thread.teamId === teamId);
    if (!thread) {
      thread = { threadId: data.nextThreadId++, teamId, createdAt: now() };
      data.threads.push(thread);
    }
    return thread;
  }

  return [
    http.get(
      `${API_BASE_URL}${ENDPOINTS.TEAM_THREAD.BY_TEAM(':teamId')}`,
      ({ request, params }) => {
        const access = guard(request, String(params.teamId));
        if ('response' in access) return access.response;
        return HttpResponse.json(getOrCreateThread(access.team.id));
      },
    ),
    http.get(
      `${API_BASE_URL}${ENDPOINTS.TEAM_MESSAGE.BY_TEAM(':teamId')}`,
      ({ request, params }) => {
        const access = guard(request, String(params.teamId));
        if ('response' in access) return access.response;
        const query = new URL(request.url).searchParams;
        const relatedType = query.get('relatedType');
        const page = Number(query.get('page') ?? 0);
        const size = Number(query.get('size') ?? 10);
        if (
          (relatedType != null && !isRelatedType(relatedType)) ||
          !Number.isSafeInteger(page) ||
          page < 0 ||
          !isId(size)
        ) {
          return error(400, 'INVALID_REQUEST');
        }
        const thread = data.threads.find(
          thread => thread.teamId === access.team.id,
        );
        if (!thread) return error(404, 'TEAM_THREAD_NOT_FOUND');
        const matching = data.messages
          .filter(
            message =>
              message.threadId === thread.threadId &&
              (relatedType == null || message.relatedType === relatedType),
          )
          .sort((a, b) => b.id - a.id);
        const totalPages = Math.ceil(matching.length / size);
        return HttpResponse.json({
          contents: matching.slice(page * size, (page + 1) * size),
          pageable: {
            page,
            size,
            totalElements: matching.length,
            totalPages,
            isEnd: page + 1 >= totalPages,
          },
        });
      },
    ),
    http.post(
      `${API_BASE_URL}${ENDPOINTS.TEAM_MESSAGE.BY_TEAM(':teamId')}`,
      async ({ request, params }) => {
        const access = guard(request, String(params.teamId));
        if ('response' in access) return access.response;
        let input: SubmitTeamMessageInput;
        try {
          input = (await request.json()) as SubmitTeamMessageInput;
        } catch {
          return error(400, 'INVALID_REQUEST');
        }
        if (
          !input ||
          typeof input.message !== 'string' ||
          !input.message.trim() ||
          (input.relatedType != null && !isRelatedType(input.relatedType)) ||
          (input.relatedId != null && !Number.isSafeInteger(input.relatedId))
        ) {
          return error(400, 'INVALID_REQUEST');
        }
        const thread = getOrCreateThread(access.team.id);
        const message: TeamMessagePersistResponse = {
          id: data.nextMessageId++,
          threadId: thread.threadId,
          senderId: access.userId,
          senderName: teamMessageSenderNames[access.userId],
          relatedType: input.relatedType ?? 'GENERAL',
          ...(input.relatedId != null ? { relatedId: input.relatedId } : {}),
          message: input.message,
          createdAt: now(),
        };
        data.messages.push({ ...message, important: false, read: false });
        return HttpResponse.json(message, { status: 201 });
      },
    ),
  ];
}

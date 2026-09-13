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
  persist?: boolean;
};

const teamMessageStorageKey = 'aics.oop.msw.team-messages';

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
  const initialData = createTeamMessageData();
  const data = loadTeamMessageData(initialData, options.persist ?? false);
  const authenticatedUserId =
    options.getAuthenticatedUserId ??
    ((request: Request) =>
      getMockAuthenticatedAccount(request)?.user.studentNumber);
  const now = () => new Date().toISOString().slice(0, 16).replace('T', ' ');

  function persistData() {
    if (!options.persist || typeof localStorage === 'undefined') return;

    try {
      localStorage.setItem(teamMessageStorageKey, JSON.stringify(data));
    } catch {
      // Persistence is only a development convenience for the MSW scenario.
    }
  }

  function guard(request: Request, teamId: string) {
    const userId = authenticatedUserId(request);
    const account = getMockAuthenticatedAccount(request);
    if (!userId) return { response: new HttpResponse(null, { status: 401 }) };
    if (!/^\d+$/.test(teamId) || !isId(Number(teamId)))
      return { response: error(400, 'INVALID_REQUEST') };
    const team = data.teams.find(team => team.id === Number(teamId));
    const isAdmin = Boolean(account && account.user.globalRole !== 'STUDENT');
    const isAdminSectionMember = Boolean(
      account?.user.sections.some(
        section => String(section.id) === team?.sectionId,
      ),
    );
    if (
      !team ||
      (isAdmin && !isAdminSectionMember) ||
      (!isAdmin &&
        !team.memberIds.includes(userId) &&
        team.professorId !== userId)
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
      persistData();
    }
    return thread;
  }

  function guardMessage(request: Request, messageId: string) {
    if (!/^\d+$/.test(messageId) || !isId(Number(messageId))) {
      return { response: error(400, 'INVALID_REQUEST') };
    }
    const message = data.messages.find(
      message => message.id === Number(messageId),
    );
    if (!message) return { response: error(404, 'MESSAGE_NOT_FOUND') };
    const thread = data.threads.find(
      thread => thread.threadId === message.threadId,
    );
    if (!thread) return { response: error(404, 'TEAM_THREAD_NOT_FOUND') };
    const access = guard(request, String(thread.teamId));
    if ('response' in access) return access;
    return { access, message };
  }

  return [
    http.get(`${API_BASE_URL}/api/v1/admin/oop/messages`, ({ request }) => {
      const account = getMockAuthenticatedAccount(request);
      if (!account || account.user.globalRole === 'STUDENT') {
        return error(401, 'UNAUTHORIZED');
      }
      const query = new URL(request.url).searchParams;
      const sectionId = query.get('sectionId');
      const accessible = account.user.sections.map(section =>
        String(section.id),
      );
      if (sectionId && !accessible.includes(sectionId)) {
        return error(403, 'ACCESS_DENIED');
      }
      const section = account.user.sections.find(
        item => !sectionId || String(item.id) === sectionId,
      );
      if (!section) return error(403, 'ACCESS_DENIED');
      const contents = data.messages.flatMap(message => {
        const thread = data.threads.find(
          item => item.threadId === message.threadId,
        );
        const team = data.teams.find(item => item.id === thread?.teamId);
        if (!team) return [];
        if (!accessible.includes(team.sectionId)) return [];

        return {
          ...message,
          sectionId: team.sectionId,
          sectionName:
            account.user.sections.find(
              candidate => String(candidate.id) === team.sectionId,
            )?.name ?? team.sectionId,
          teamId: team.id,
          teamName: team.name,
        };
      });
      return HttpResponse.json({
        contents,
        unreadCount: contents.filter(message => !message.read).length,
        pageable: {
          page: 0,
          size: contents.length,
          totalElements: contents.length,
          totalPages: 1,
          isEnd: true,
        },
      });
    }),
    http.patch(
      `${API_BASE_URL}/api/v1/admin/oop/messages/:messageId/read`,
      ({ request, params }) => {
        const guarded = guardMessage(request, String(params.messageId));
        if (!('message' in guarded)) return guarded.response;
        guarded.message.read = true;
        persistData();
        return new HttpResponse(null, { status: 204 });
      },
    ),
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
        persistData();
        return HttpResponse.json(message, { status: 201 });
      },
    ),
    http.get(
      `${API_BASE_URL}${ENDPOINTS.TEAM_MESSAGE.UNREAD_COUNT(':teamId')}`,
      ({ request, params }) => {
        const access = guard(request, String(params.teamId));
        if ('response' in access) return access.response;
        const thread = data.threads.find(
          thread => thread.teamId === access.team.id,
        );
        const count = thread
          ? data.messages.filter(
              message => message.threadId === thread.threadId && !message.read,
            ).length
          : 0;
        return HttpResponse.json({ count });
      },
    ),
    http.patch(
      `${API_BASE_URL}${ENDPOINTS.TEAM_MESSAGE.IMPORTANT(':messageId')}`,
      async ({ request, params }) => {
        const guarded = guardMessage(request, String(params.messageId));
        if (!('message' in guarded)) return guarded.response;
        let body: { important?: unknown };
        try {
          body = (await request.json()) as { important?: unknown };
        } catch {
          return error(400, 'INVALID_REQUEST');
        }
        if (typeof body?.important !== 'boolean') {
          return error(400, 'INVALID_REQUEST');
        }
        guarded.message.important = body.important;
        persistData();
        return new HttpResponse(null, { status: 204 });
      },
    ),
    http.patch(
      `${API_BASE_URL}${ENDPOINTS.TEAM_MESSAGE.READ(':messageId')}`,
      ({ request, params }) => {
        const guarded = guardMessage(request, String(params.messageId));
        if (!('message' in guarded)) return guarded.response;
        guarded.message.read = true;
        persistData();
        return new HttpResponse(null, { status: 204 });
      },
    ),
  ];
}

function loadTeamMessageData(
  initialData: ReturnType<typeof createTeamMessageData>,
  shouldPersist: boolean,
) {
  if (!shouldPersist || typeof localStorage === 'undefined') return initialData;

  try {
    const stored = localStorage.getItem(teamMessageStorageKey);
    if (!stored) return initialData;

    const parsed = JSON.parse(stored) as Partial<
      ReturnType<typeof createTeamMessageData>
    >;
    if (
      !Array.isArray(parsed.messages) ||
      !Array.isArray(parsed.teams) ||
      !Array.isArray(parsed.threads) ||
      !Number.isSafeInteger(parsed.nextMessageId) ||
      !Number.isSafeInteger(parsed.nextThreadId)
    ) {
      return initialData;
    }

    return parsed as ReturnType<typeof createTeamMessageData>;
  } catch {
    return initialData;
  }
}

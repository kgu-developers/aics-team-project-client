import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { http, HttpResponse } from 'msw';

import {
  reopenAdminProjectProposal,
  resetAdminProjectProposalScenario,
} from './adminProjectProposal';
import { appendPersistentMockFeedbackTeamMessage } from './teamMessages';
import { getMockAuthenticatedAccount } from '../authSession';
import { demoAdmin } from '../data/users';

const feedbackStorageKey = 'aics.oop.msw.admin-proposal-feedbacks';
const accessibleSectionIds = new Set(['1', 'oop-2026-2-01']);
const initialFeedbacks = [
  {
    createdAt: '2026-09-01 09:30',
    message: '제안서의 문제 정의와 구현 범위를 보완해 주세요.',
    messageId: 710,
    projectId: 1001,
    senderId: demoAdmin.id,
    senderName: demoAdmin.name,
    teamId: 1,
  },
];

function loadFeedbacks() {
  if (typeof localStorage === 'undefined')
    return structuredClone(initialFeedbacks);

  try {
    const stored = localStorage.getItem(feedbackStorageKey);
    if (!stored) return structuredClone(initialFeedbacks);
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed)
      ? (parsed as typeof initialFeedbacks)
      : structuredClone(initialFeedbacks);
  } catch {
    return structuredClone(initialFeedbacks);
  }
}

let feedbacks = loadFeedbacks();

function persistFeedbacks() {
  if (typeof localStorage === 'undefined') return;

  try {
    localStorage.setItem(feedbackStorageKey, JSON.stringify(feedbacks));
  } catch {
    // Persistence is only a development convenience for the MSW scenario.
  }
}

function isAdmin(request: Request) {
  return getMockAuthenticatedAccount(request)?.user.id === demoAdmin.id;
}

function hasAccessibleTeam(sectionId: string, teamId: string) {
  return accessibleSectionIds.has(sectionId) && teamId === '1';
}

export function resetAdminProposalFeedbackScenario() {
  feedbacks = structuredClone(initialFeedbacks);
  resetAdminProjectProposalScenario();
  if (typeof localStorage !== 'undefined')
    localStorage.removeItem(feedbackStorageKey);
}

export const adminProposalFeedbackHandlers = [
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_TEAM_PROPOSAL(':sectionId', ':teamId')}/feedbacks`,
    ({ params, request }) => {
      if (!isAdmin(request))
        return HttpResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 });

      const sectionId = String(params.sectionId);
      const teamId = String(params.teamId);
      if (!accessibleSectionIds.has(sectionId))
        return HttpResponse.json({ code: 'ACCESS_DENIED' }, { status: 403 });
      if (teamId !== '1') {
        return HttpResponse.json({
          contents: [],
          pageable: {
            isEnd: true,
            page: 0,
            size: 20,
            totalElements: 0,
            totalPages: 0,
          },
        });
      }

      const query = new URL(request.url).searchParams;
      const page = Number(query.get('page') ?? 0);
      const size = Number(query.get('size') ?? 20);
      if (
        !Number.isSafeInteger(page) ||
        page < 0 ||
        !Number.isSafeInteger(size) ||
        size <= 0 ||
        size > 100
      )
        return HttpResponse.json({ code: 'INVALID_REQUEST' }, { status: 400 });

      const contents = feedbacks
        .filter(feedback => feedback.teamId === Number(teamId))
        .sort((left, right) => right.messageId - left.messageId);
      const totalElements = contents.length;
      const totalPages = Math.ceil(totalElements / size);

      return HttpResponse.json({
        contents: contents.slice(page * size, (page + 1) * size),
        pageable: {
          isEnd: page + 1 >= totalPages,
          page,
          size,
          totalElements,
          totalPages,
        },
      });
    },
  ),
  http.post(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_TEAM_PROPOSAL(':sectionId', ':teamId')}/feedback`,
    async ({ params, request }) => {
      if (!isAdmin(request))
        return HttpResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 });

      const sectionId = String(params.sectionId);
      const teamId = String(params.teamId);
      if (!hasAccessibleTeam(sectionId, teamId)) {
        return HttpResponse.json(
          { code: 'PROPOSAL_NOT_FOUND' },
          { status: accessibleSectionIds.has(sectionId) ? 404 : 403 },
        );
      }

      const body = (await request.json()) as { message?: unknown };
      if (
        typeof body.message !== 'string' ||
        !body.message.trim() ||
        body.message.length > 2000
      )
        return HttpResponse.json({ code: 'INVALID_REQUEST' }, { status: 400 });

      const feedback = {
        createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        message: body.message.trim(),
        messageId: Math.max(0, ...feedbacks.map(item => item.messageId)) + 1,
        projectId: 1001,
        senderId: demoAdmin.id,
        senderName: demoAdmin.name,
        teamId: Number(teamId),
      };
      feedbacks = [feedback, ...feedbacks];
      persistFeedbacks();
      reopenAdminProjectProposal(feedback.teamId);
      appendPersistentMockFeedbackTeamMessage({
        createdAt: feedback.createdAt,
        message: feedback.message,
        relatedId: feedback.projectId,
        relatedType: 'PROPOSAL',
        senderId: feedback.senderId,
        senderName: feedback.senderName,
        teamId: feedback.teamId,
      });
      return HttpResponse.json(feedback);
    },
  ),
];

import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { http, HttpResponse } from 'msw';

import { appendPersistentMockFeedbackTeamMessage } from './teamMessages';
import { getMockAuthenticatedAccount } from '../authSession';
import { demoAdmin } from '../data/users';

type MidReport = {
  blocks: Array<{
    fields: unknown;
    key: string;
    lastEditedBy: string | null;
    lastEditedByName: string | null;
    lastSavedAt: string | null;
    status: string;
    title: string;
  }>;
  dueDate: string | null;
  id: number;
  leaderName: string | null;
  milestoneId: number;
  revision: null;
  status: string;
  submittedAt: string | null;
  submittedBy: string | null;
  submittedByName: string | null;
  teamId: number;
  teamName: string;
  title: string;
  version: number;
};

const initialFeedbacks = [
  {
    createdAt: '2026-09-12 10:30',
    message: 'GUI 화면 흐름과 예외 처리 계획을 보완해 주세요.',
    messageId: 701,
    midReportId: 401,
    senderId: demoAdmin.id,
    senderName: demoAdmin.name,
    teamId: 1,
  },
];
const feedbackStorageKey = 'aics.oop.msw.admin-mid-report-feedbacks';

function loadFeedbacks() {
  if (typeof localStorage === 'undefined') {
    return structuredClone(initialFeedbacks);
  }

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

function persistFeedbacks() {
  if (typeof localStorage === 'undefined') return;

  try {
    localStorage.setItem(feedbackStorageKey, JSON.stringify(feedbacks));
  } catch {
    // localStorage is only a development convenience for the MSW scenario.
  }
}

let feedbacks = loadFeedbacks();

function getMidReport(teamId: string): MidReport | undefined {
  if (!['1', '2'].includes(teamId)) return undefined;

  const normalizedTeamId = Number(teamId);
  const teamName = `OOP-01 - ${normalizedTeamId}팀`;

  return {
    blocks: [
      {
        fields: [
          {
            key: 'topic',
            label: '프로젝트 주제',
            value:
              normalizedTeamId === 1
                ? 'AI 기반 팀 프로젝트 관리 서비스'
                : '캠퍼스 학습 일정 관리 서비스',
          },
        ],
        key: 'project-topic',
        lastEditedBy: normalizedTeamId === 1 ? '20230001' : '20230002',
        lastEditedByName:
          normalizedTeamId === 1 ? '테스트학생1' : '테스트학생2',
        lastSavedAt: '2026-09-10T10:00:00',
        status: 'COMPLETED',
        title: '1. 프로젝트 주제',
      },
      {
        fields: [
          {
            key: 'guiScreens',
            label: 'GUI 화면',
            value:
              '[{"title":"홈 화면","imageUrl":"https://example.com/home.png"}]',
          },
        ],
        key: 'gui-design',
        lastEditedBy: normalizedTeamId === 1 ? '20230001' : '20230002',
        lastEditedByName:
          normalizedTeamId === 1 ? '테스트학생1' : '테스트학생2',
        lastSavedAt: '2026-09-10T10:05:00',
        status: 'COMPLETED',
        title: '2. 화면 GUI 설계',
      },
      {
        fields: [
          {
            key: 'engine',
            label: '핵심 로직',
            value: '팀·제출물·피드백 상태를 관리합니다.',
          },
        ],
        key: 'engine-design',
        lastEditedBy: normalizedTeamId === 1 ? '20230001' : '20230002',
        lastEditedByName:
          normalizedTeamId === 1 ? '테스트학생1' : '테스트학생2',
        lastSavedAt: '2026-09-10T10:10:00',
        status: 'COMPLETED',
        title: '3. 핵심 로직/엔진 설계',
      },
      {
        fields: [
          {
            key: 'plan',
            label: '향후 계획',
            value: '발표 전 통합 테스트를 진행합니다.',
          },
        ],
        key: 'future-plan',
        lastEditedBy: normalizedTeamId === 1 ? '20230001' : '20230002',
        lastEditedByName:
          normalizedTeamId === 1 ? '테스트학생1' : '테스트학생2',
        lastSavedAt: '2026-09-10T10:15:00',
        status: 'COMPLETED',
        title: '4. 향후 진행 계획',
      },
    ],
    dueDate: '2026-09-20T23:59:00',
    id: 400 + normalizedTeamId,
    leaderName: normalizedTeamId === 1 ? '테스트학생1' : '테스트학생2',
    milestoneId: 102,
    revision: null,
    status: 'SUBMITTED',
    submittedAt: '2026-09-10T11:00:00',
    submittedBy: normalizedTeamId === 1 ? '20230001' : '20230002',
    submittedByName: normalizedTeamId === 1 ? '테스트학생1' : '테스트학생2',
    teamId: normalizedTeamId,
    teamName,
    title: `${teamName} 중간보고서`,
    version: 1,
  };
}

function isAdmin(request: Request) {
  return getMockAuthenticatedAccount(request)?.user.id === demoAdmin.id;
}

export function resetAdminMidReportScenario() {
  feedbacks = structuredClone(initialFeedbacks);
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(feedbackStorageKey);
  }
}

export const adminMidReportHandlers = [
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_TEAM_MID_REPORT(':sectionId', ':teamId')}`,
    ({ params, request }) => {
      if (!isAdmin(request)) {
        return HttpResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 });
      }
      const report = getMidReport(params.teamId as string);
      if (
        !['1', 'oop-2026-2-01'].includes(String(params.sectionId)) ||
        !report
      ) {
        return HttpResponse.json(
          { code: 'MID_REPORT_NOT_FOUND' },
          { status: 404 },
        );
      }

      return HttpResponse.json(report);
    },
  ),
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_TEAM_MID_REPORT(':sectionId', ':teamId')}/feedbacks`,
    ({ params, request }) => {
      if (!isAdmin(request))
        return HttpResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 });
      if (
        !['1', 'oop-2026-2-01'].includes(String(params.sectionId)) ||
        !getMidReport(params.teamId as string)
      )
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
      return HttpResponse.json({
        contents: feedbacks.filter(
          feedback => feedback.teamId === Number(params.teamId),
        ),
        pageable: {
          isEnd: true,
          page: 0,
          size: 20,
          totalElements: feedbacks.filter(
            feedback => feedback.teamId === Number(params.teamId),
          ).length,
          totalPages: 1,
        },
      });
    },
  ),
  http.post(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_TEAM_MID_REPORT(':sectionId', ':teamId')}/feedback`,
    async ({ params, request }) => {
      if (!isAdmin(request))
        return HttpResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 });
      const body = (await request.json()) as { message?: unknown };
      if (
        !['1', 'oop-2026-2-01'].includes(String(params.sectionId)) ||
        !getMidReport(params.teamId as string) ||
        typeof body.message !== 'string' ||
        !body.message.trim()
      )
        return HttpResponse.json({ code: 'INVALID_REQUEST' }, { status: 400 });
      const feedback = {
        createdAt: '2026-09-13 16:00',
        message: body.message.trim(),
        messageId: Math.max(...feedbacks.map(item => item.messageId)) + 1,
        midReportId: 400 + Number(params.teamId),
        senderId: demoAdmin.id,
        senderName: demoAdmin.name,
        teamId: Number(params.teamId),
      };
      feedbacks = [feedback, ...feedbacks];
      persistFeedbacks();
      appendPersistentMockFeedbackTeamMessage({
        createdAt: feedback.createdAt,
        message: feedback.message,
        relatedId: feedback.midReportId,
        relatedType: 'MID_REPORT',
        senderId: feedback.senderId,
        senderName: feedback.senderName,
        teamId: feedback.teamId,
      });
      return HttpResponse.json(feedback);
    },
  ),
];

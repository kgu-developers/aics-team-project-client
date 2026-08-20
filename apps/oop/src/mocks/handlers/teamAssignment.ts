import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import type {
  PartnerCandidate,
  TeamAssignmentProjection,
  TeamAssignmentSurvey,
} from '@aics/core';
import { http, HttpResponse } from 'msw';

import {
  assignedFixture,
  demoTeamAssignmentSectionId,
  teamAssignmentFixture,
} from '../data/teamAssignment';
import {
  demoAccessToken,
  demoCompletedAccessToken,
  demoPartnerAccessToken,
  demoPartnerStudent,
  demoStudent,
  getDemoStudentAccount,
} from '../data/users';

const partnerCandidates: Record<string, PartnerCandidate> = {
  'student-a': {
    id: 'student-a',
    name: demoStudent.name,
    studentNumber: demoStudent.studentNumber,
    program: '객체지향프로그래밍',
  },
  'student-b': {
    id: 'student-b',
    name: demoPartnerStudent.name,
    studentNumber: demoPartnerStudent.studentNumber,
    program: '객체지향프로그래밍',
  },
};

const studentIdByAccessToken: Record<string, keyof typeof partnerCandidates> = {
  [demoAccessToken]: 'student-a',
  [demoPartnerAccessToken]: 'student-b',
};

function createInitialProjections(): Record<string, TeamAssignmentProjection> {
  return {
    [demoAccessToken]: structuredClone(teamAssignmentFixture),
    [demoPartnerAccessToken]: {
      ...structuredClone(teamAssignmentFixture),
      incomingPartnerRequest: {
        id: 'request-student-a-to-student-b',
        requester: partnerCandidates['student-a']!,
        status: 'pending',
      },
    },
    [demoCompletedAccessToken]: assignedFixture('completed'),
  };
}

let projectionsByAccessToken = createInitialProjections();

function getAccessToken(request: Request) {
  return request.headers.get('authorization')?.replace('Bearer ', '') ?? null;
}

function getProjection(request: Request) {
  const accessToken = getAccessToken(request);
  return accessToken ? projectionsByAccessToken[accessToken] : undefined;
}

function guard(request: Request, sectionId: string) {
  const account = getDemoStudentAccount(getAccessToken(request));
  if (!account) {
    return HttpResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 });
  }
  if (sectionId !== demoTeamAssignmentSectionId) {
    return HttpResponse.json(
      { code: 'SECTION_ACCESS_DENIED' },
      { status: 403 },
    );
  }
  return undefined;
}

function findCandidate(query: string, requesterId: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];

  return Object.entries(partnerCandidates)
    .filter(([studentId]) => studentId !== requesterId)
    .map(([, candidate]) => candidate)
    .filter(candidate =>
      `${candidate.name} ${candidate.studentNumber}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
}

function applyDevelopmentPreview(request: Request) {
  if (!import.meta.env.DEV) return undefined;
  const phase = request.headers.get('X-OOP-Team-Assignment-Preview');
  if (
    phase !== 'resultWaiting' &&
    phase !== 'result' &&
    phase !== 'firstMeeting' &&
    phase !== 'completed'
  ) {
    return undefined;
  }

  if (phase === 'resultWaiting') {
    return {
      ...structuredClone(teamAssignmentFixture),
      phase,
      window: { resultReleasesAt: '2026-09-08T10:00:00+09:00' },
    } satisfies TeamAssignmentProjection;
  }
  return assignedFixture(phase);
}

export const teamAssignmentHandlers = [
  http.get(
    `${API_BASE_URL}${ENDPOINTS.TEAM_ASSIGNMENT.ROOT(':sectionId')}`,
    ({ params, request }) => {
      const preview = applyDevelopmentPreview(request);
      if (preview) return HttpResponse.json(preview);
      const denied = guard(request, String(params.sectionId));
      if (denied) return denied;
      return HttpResponse.json(getProjection(request));
    },
  ),
  http.get(
    `${API_BASE_URL}${ENDPOINTS.TEAM_ASSIGNMENT.PARTNER_CANDIDATES(':sectionId')}`,
    ({ params, request }) => {
      const denied = guard(request, String(params.sectionId));
      if (denied) return denied;
      const accessToken = getAccessToken(request)!;
      const requesterId = studentIdByAccessToken[accessToken];
      const query = new URL(request.url).searchParams.get('query') ?? '';
      return HttpResponse.json(findCandidate(query, requesterId!));
    },
  ),
  http.post(
    `${API_BASE_URL}${ENDPOINTS.TEAM_ASSIGNMENT.PARTNER_REQUESTS(':sectionId')}`,
    async ({ params, request }) => {
      const denied = guard(request, String(params.sectionId));
      if (denied) return denied;

      const accessToken = getAccessToken(request)!;
      const requesterId = studentIdByAccessToken[accessToken]!;
      const { candidateId } = (await request.json()) as { candidateId: string };
      const candidate = partnerCandidates[candidateId];
      if (!candidate || candidateId === requesterId) {
        return HttpResponse.json(
          { code: 'PARTNER_NOT_FOUND' },
          { status: 404 },
        );
      }

      const recipientToken = Object.entries(studentIdByAccessToken).find(
        ([, studentId]) => studentId === candidateId,
      )?.[0];
      if (!recipientToken) {
        return HttpResponse.json(
          { code: 'PARTNER_NOT_FOUND' },
          { status: 404 },
        );
      }

      const requestId = `request-${requesterId}-to-${candidateId}`;
      projectionsByAccessToken[accessToken] = {
        ...projectionsByAccessToken[accessToken]!,
        outgoingPartnerRequest: {
          id: requestId,
          recipient: candidate,
          status: 'pending',
        },
      };
      projectionsByAccessToken[recipientToken] = {
        ...projectionsByAccessToken[recipientToken]!,
        incomingPartnerRequest: {
          id: requestId,
          requester: partnerCandidates[requesterId]!,
          status: 'pending',
        },
      };
      return HttpResponse.json(projectionsByAccessToken[accessToken]);
    },
  ),
  http.delete(
    `${API_BASE_URL}${ENDPOINTS.TEAM_ASSIGNMENT.PARTNER_REQUEST(':sectionId', ':requestId')}`,
    ({ params, request }) => {
      const denied = guard(request, String(params.sectionId));
      if (denied) return denied;
      const accessToken = getAccessToken(request)!;
      const projection = projectionsByAccessToken[accessToken]!;
      const requestId = String(params.requestId);
      if (projection.outgoingPartnerRequest?.id !== requestId) {
        return HttpResponse.json(
          { code: 'REQUEST_NOT_FOUND' },
          { status: 404 },
        );
      }
      const recipientId = projection.outgoingPartnerRequest.recipient.id;
      const recipientToken = Object.entries(studentIdByAccessToken).find(
        ([, studentId]) => studentId === recipientId,
      )?.[0];
      projectionsByAccessToken[accessToken] = {
        ...projection,
        outgoingPartnerRequest: undefined,
      };
      if (recipientToken) {
        projectionsByAccessToken[recipientToken] = {
          ...projectionsByAccessToken[recipientToken]!,
          incomingPartnerRequest: undefined,
        };
      }
      return HttpResponse.json(projectionsByAccessToken[accessToken]);
    },
  ),
  http.post(
    `${API_BASE_URL}${ENDPOINTS.TEAM_ASSIGNMENT.PARTNER_REQUEST_RESPONSE(':sectionId', ':requestId')}`,
    async ({ params, request }) => {
      const denied = guard(request, String(params.sectionId));
      if (denied) return denied;
      const accessToken = getAccessToken(request)!;
      const currentProjection = projectionsByAccessToken[accessToken]!;
      const { decision } = (await request.json()) as {
        decision: 'approve' | 'reject';
      };
      if (decision !== 'approve' && decision !== 'reject') {
        return HttpResponse.json({ code: 'INVALID_DECISION' }, { status: 400 });
      }
      if (currentProjection.incomingPartnerRequest?.id !== params.requestId) {
        return HttpResponse.json(
          { code: 'REQUEST_NOT_FOUND' },
          { status: 404 },
        );
      }

      const requesterId =
        currentProjection.incomingPartnerRequest!.requester.id;
      const requesterToken = Object.entries(studentIdByAccessToken).find(
        ([, studentId]) => studentId === requesterId,
      )?.[0];
      projectionsByAccessToken[accessToken] = {
        ...currentProjection,
        incomingPartnerRequest: undefined,
        ...(decision === 'approve'
          ? {
              confirmedPartner:
                currentProjection.incomingPartnerRequest!.requester,
            }
          : {}),
      };
      if (requesterToken) {
        projectionsByAccessToken[requesterToken] = {
          ...projectionsByAccessToken[requesterToken]!,
          outgoingPartnerRequest: undefined,
          ...(decision === 'approve'
            ? {
                confirmedPartner:
                  partnerCandidates[studentIdByAccessToken[accessToken]!]!,
              }
            : {}),
        };
      }
      return HttpResponse.json(projectionsByAccessToken[accessToken]);
    },
  ),
  http.put(
    `${API_BASE_URL}${ENDPOINTS.TEAM_ASSIGNMENT.SURVEY(':sectionId')}`,
    async ({ params, request }) => {
      const denied = guard(request, String(params.sectionId));
      if (denied) return denied;
      const accessToken = getAccessToken(request)!;
      const projection = projectionsByAccessToken[accessToken]!;
      if (projection.phase !== 'survey') {
        return HttpResponse.json({ code: 'PHASE_CLOSED' }, { status: 403 });
      }
      projectionsByAccessToken[accessToken] = {
        ...projection,
        survey: (await request.json()) as TeamAssignmentSurvey,
      };
      return HttpResponse.json(projectionsByAccessToken[accessToken]);
    },
  ),
  http.post(
    `${API_BASE_URL}${ENDPOINTS.TEAM_ASSIGNMENT.SURVEY(':sectionId')}`,
    async ({ params, request }) => {
      const denied = guard(request, String(params.sectionId));
      if (denied) return denied;
      const accessToken = getAccessToken(request)!;
      const projection = projectionsByAccessToken[accessToken]!;
      if (projection.phase !== 'survey') {
        return HttpResponse.json(
          { code: 'DUPLICATE_OR_CLOSED' },
          { status: 409 },
        );
      }
      const survey = (await request.json()) as TeamAssignmentSurvey;
      projectionsByAccessToken[accessToken] = {
        ...projection,
        phase: 'resultWaiting',
        survey,
        window: { resultReleasesAt: '2026-09-08T10:00:00+09:00' },
      };
      return HttpResponse.json(projectionsByAccessToken[accessToken]);
    },
  ),
  http.post(
    `${API_BASE_URL}/sections/:sectionId/team-assignment/teams/:teamId/leader`,
    ({ params, request }) => {
      const preview = applyDevelopmentPreview(request);
      const denied = guard(request, String(params.sectionId));
      if (denied) return denied;
      const accessToken = getAccessToken(request)!;
      const projection = preview ?? projectionsByAccessToken[accessToken]!;
      if (
        projection.phase !== 'firstMeeting' ||
        projection.assignedTeam?.id !== params.teamId
      ) {
        return HttpResponse.json(
          { code: 'PHASE_ACCESS_DENIED' },
          { status: 403 },
        );
      }
      projectionsByAccessToken[accessToken] = {
        ...projection,
        phase: 'completed',
        leaderConfirmation: {
          status: 'confirmed',
          isActionAvailable: false,
          unavailableReason: '팀장 확정이 완료되었습니다.',
        },
      };
      return HttpResponse.json(projectionsByAccessToken[accessToken]);
    },
  ),
];

export function resetTeamAssignmentMockData() {
  projectionsByAccessToken = createInitialProjections();
}

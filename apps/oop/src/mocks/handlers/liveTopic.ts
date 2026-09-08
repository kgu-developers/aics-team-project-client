import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import type { TeamProjectResponse } from '@aics/core';
import { http, HttpResponse } from 'msw';

import { getMockAuthenticatedAccount } from '../authSession';
import {
  createLiveTopicState,
  liveTopicMemberNumbers,
  liveTopicTeamId,
} from '../data/liveTopic';
import { meetingApiTeam } from '../data/meetingApi';

/** Independent fixture state for the deployed team/candidate contract. */
export function createLiveTopicHandlers(
  initialProject: TeamProjectResponse | null = null,
) {
  let project = initialProject ? structuredClone(initialProject) : null;
  const state = createLiveTopicState();
  function guard(request: Request, teamId = liveTopicTeamId) {
    const account = getMockAuthenticatedAccount(request);
    if (!account)
      return {
        response: HttpResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 }),
      };
    const studentNumber = account.user.studentNumber;
    if (
      teamId !== liveTopicTeamId ||
      !liveTopicMemberNumbers.includes(studentNumber)
    ) {
      return {
        response: HttpResponse.json(
          { code: 'TEAM_ACCESS_DENIED' },
          { status: 403 },
        ),
      };
    }
    return { studentNumber };
  }
  return [
    http.get(
      `${API_BASE_URL}${ENDPOINTS.PROJECT.BY_TEAM(':teamId')}`,
      ({ request, params }) => {
        const result = guard(request, String(params.teamId));
        if ('response' in result) return result.response;
        return project
          ? HttpResponse.json(project)
          : HttpResponse.json({ code: 'PROJECT_NOT_FOUND' }, { status: 404 });
      },
    ),
    http.patch(
      `${API_BASE_URL}${ENDPOINTS.TOPIC.FINALIZE(':teamId')}`,
      async ({ request, params }) => {
        const result = guard(request, String(params.teamId));
        if ('response' in result) return result.response;
        if (
          !meetingApiTeam.members.some(
            member =>
              member.studentNumber === result.studentNumber && member.isLeader,
          )
        )
          return HttpResponse.json({ code: 'ACCESS_DENIED' }, { status: 403 });
        const input = (await request.json()) as {
          candidateId?: number;
          goal?: string;
        };
        if (
          !Number.isSafeInteger(input.candidateId) ||
          typeof input.goal !== 'string' ||
          !input.goal.trim()
        )
          return HttpResponse.json(
            { code: 'INVALID_REQUEST' },
            { status: 400 },
          );
        const candidate = state.candidates.find(
          item => item.id === input.candidateId,
        );
        if (!candidate)
          return HttpResponse.json(
            { code: 'TOPIC_CANDIDATE_NOT_FOUND' },
            { status: 404 },
          );
        if (project?.proposalCompletedAt)
          return HttpResponse.json(
            { code: 'PROJECT_PROPOSAL_COMPLETED' },
            { status: 409 },
          );
        project = {
          ...project,
          id: project?.id ?? 17,
          teamId: Number(liveTopicTeamId),
          title: candidate.title,
          description: candidate.description,
          goal: input.goal.trim(),
          proposalCompletedAt: null,
        };
        return HttpResponse.json({
          projectId: project.id,
          candidateId: candidate.id,
          title: candidate.title,
        });
      },
    ),
    http.get(
      `${API_BASE_URL}${ENDPOINTS.TOPIC.CANDIDATES(':teamId')}`,
      ({ request, params }) => {
        const result = guard(request, String(params.teamId));
        if ('response' in result) return result.response;
        return HttpResponse.json({
          contents: state.candidates.map(candidate => ({
            ...candidate,
            voteCount: [...state.votes.values()].filter(
              id => id === candidate.id,
            ).length,
            votedByMe: state.votes.get(result.studentNumber) === candidate.id,
          })),
        });
      },
    ),
    http.post(
      `${API_BASE_URL}${ENDPOINTS.TOPIC.CANDIDATES(':teamId')}`,
      async ({ request, params }) => {
        const result = guard(request, String(params.teamId));
        if ('response' in result) return result.response;
        const input = (await request.json()) as Record<string, unknown>;
        if (
          typeof input.title !== 'string' ||
          !input.title.trim() ||
          input.title.trim().length > 200 ||
          typeof input.description !== 'string' ||
          !input.description.trim()
        ) {
          return HttpResponse.json(
            { code: 'INVALID_CANDIDATE' },
            { status: 400 },
          );
        }
        const title = input.title.trim();
        if (
          state.candidates.some(
            candidate =>
              candidate.proposerUserId === result.studentNumber ||
              candidate.title === title,
          )
        ) {
          return HttpResponse.json(
            { code: 'DUPLICATE_CANDIDATE' },
            { status: 409 },
          );
        }
        const candidate = {
          id: state.nextId++,
          proposerUserId: result.studentNumber,
          title: input.title.trim(),
          description: input.description.trim(),
        };
        state.candidates.push(candidate);
        return HttpResponse.json(candidate, { status: 201 });
      },
    ),
    http.post(
      `${API_BASE_URL}${ENDPOINTS.TOPIC.CANDIDATE_VOTE(':candidateId')}`,
      ({ request, params }) => {
        const result = guard(request);
        if ('response' in result) return result.response;
        const candidateId = Number(params.candidateId);
        if (!state.candidates.some(candidate => candidate.id === candidateId)) {
          return HttpResponse.json(
            { code: 'CANDIDATE_NOT_FOUND' },
            { status: 404 },
          );
        }
        // Live server is a per-team upsert; no separate cancellation before changing.
        // It currently permits self votes, although the student UI retains its policy.
        state.votes.set(result.studentNumber, candidateId);
        return HttpResponse.json(
          { id: candidateId, candidateId, voterUserId: result.studentNumber },
          { status: 201 },
        );
      },
    ),
    http.delete(
      `${API_BASE_URL}${ENDPOINTS.TOPIC.CANDIDATE_VOTE(':candidateId')}`,
      ({ request, params }) => {
        const result = guard(request);
        if ('response' in result) return result.response;
        const candidateId = Number(params.candidateId);
        if (!state.candidates.some(candidate => candidate.id === candidateId)) {
          return HttpResponse.json(
            { code: 'CANDIDATE_NOT_FOUND' },
            { status: 404 },
          );
        }
        if (state.votes.get(result.studentNumber) === candidateId)
          state.votes.delete(result.studentNumber);
        return new HttpResponse(null, { status: 204 });
      },
    ),
  ];
}

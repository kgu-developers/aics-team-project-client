import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { http, HttpResponse } from 'msw';

import { resolveContactVisibility } from '~/features/team-assignment/liveTeamAssignment';

import { getMockAuthenticatedAccount } from '../authSession';
import { createLiveTopicHandlers } from './liveTopic';
import { meetingApiTeam } from '../data/meetingApi';
import {
  createProjectProposalFixture,
  createProposalSectionsFixture,
} from '../data/projectProposal';
import { getMockMySections } from '../data/sections';
import { createStudentPageState } from '../data/studentPages';

/** Student pages consume production contracts; fixtures and scenarios stay in MSW. */
export function createStudentPageHandlers(options: { persist?: boolean } = {}) {
  const state = createStudentPageState(options);
  function guard(request: Request, teamId: string) {
    const account = getMockAuthenticatedAccount(request);
    if (!account) return { response: new HttpResponse(null, { status: 401 }) };
    if (
      teamId !== '7' ||
      !meetingApiTeam.members.some(
        member => member.studentNumber === account.user.studentNumber,
      )
    )
      return { response: new HttpResponse(null, { status: 403 }) };
    return { account };
  }
  return [
    http.get(
      `${API_BASE_URL}${ENDPOINTS.EVALUATION.CONTEXT('1')}`,
      ({ request }) => {
        const access = guard(request, '7');
        if ('response' in access) return access.response;
        // The topic-stage fixture has no evaluation forms published yet.
        return HttpResponse.json({
          presentationMilestoneId: null,
          peerEvaluationFormId: null,
        });
      },
    ),
    ...createLiveTopicHandlers(state.project, {
      onProjectChange: state.setProject,
      projectResponse: value => ({
        ...createProjectProposalFixture(),
        ...value,
        teamOperation: {
          ...createProjectProposalFixture().teamOperation,
          ...meetingApiTeam,
        },
      }),
    }),
    http.get(
      `${API_BASE_URL}${ENDPOINTS.TEAM.MEMBER_CONTACTS(':teamId')}`,
      ({ request, params }) => {
        const access = guard(request, String(params.teamId));
        if ('response' in access) return access.response;
        const section = getMockMySections(access.account.user.studentNumber, {
          status: 'ACTIVE',
        }).find(item => item.id === 1);
        if (!section || resolveContactVisibility(section) !== 'open')
          return new HttpResponse(null, { status: 403 });
        if (state.scenario === 'contacts-error')
          return new HttpResponse(null, { status: 503 });
        return HttpResponse.json({
          contents: meetingApiTeam.members.map(member => ({
            studentNumber: member.studentNumber,
            name: member.name,
            isLeader: member.isLeader,
            phone: `010-0000-${member.studentNumber.slice(-4)}`,
          })),
        });
      },
    ),
    http.get(
      `${API_BASE_URL}${ENDPOINTS.PROJECT_PROPOSAL.SECTIONS(17)}`,
      ({ request }) => {
        const access = guard(request, '7');
        if ('response' in access) return access.response;
        if (!state.project) return new HttpResponse(null, { status: 404 });
        return HttpResponse.json(createProposalSectionsFixture());
      },
    ),
  ];
}

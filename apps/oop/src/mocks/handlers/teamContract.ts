import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import type { TeamKickoffResponse } from '@aics/core';
import { http, HttpResponse } from 'msw';

import { getMockAuthenticatedAccount } from '../authSession';
import { getMockMySections } from '../data/sections';

/** One team state shared by kickoff, contacts, leader claim and project reads. */
export function createTeamContractHandlers(team: TeamKickoffResponse) {
  function member(request: Request, teamId: unknown) {
    const account = getMockAuthenticatedAccount(request);
    if (!account) return { response: new HttpResponse(null, { status: 401 }) };
    const current = team.members.find(
      value => value.studentNumber === account.user.studentNumber,
    );
    if (String(team.id) !== String(teamId) || !current)
      return { response: new HttpResponse(null, { status: 403 }) };
    return { account, current };
  }
  return [
    http.get(
      `${API_BASE_URL}${ENDPOINTS.TEAM.KICKOFF(':teamId')}`,
      ({ request, params }) => {
        const access = member(request, params.teamId);
        return access.response ?? HttpResponse.json(team);
      },
    ),
    http.get(
      `${API_BASE_URL}${ENDPOINTS.TEAM.MEMBER_CONTACTS(':teamId')}`,
      ({ request, params }) => {
        const access = member(request, params.teamId);
        if (access.response) return access.response;
        const section = getMockMySections(access.account!.user.studentNumber, {
          status: 'ACTIVE',
        })[0];
        const from = section?.contactVisibleFrom
          ? Date.parse(section.contactVisibleFrom)
          : NaN;
        const until = section?.contactVisibleUntil
          ? Date.parse(section.contactVisibleUntil)
          : Infinity;
        if (!Number.isFinite(from) || Date.now() < from || Date.now() >= until)
          return new HttpResponse(null, { status: 403 });
        return HttpResponse.json({
          contents: team.members.map(value => ({
            studentNumber: value.studentNumber,
            name: value.name,
            isLeader: value.isLeader,
            phone: '010-0000-0000',
          })),
        });
      },
    ),
    http.post(
      `${API_BASE_URL}${ENDPOINTS.TEAM.LEADER_CLAIM(':teamId')}`,
      ({ request, params }) => {
        const access = member(request, params.teamId);
        if (access.response) return access.response;
        if (
          team.members.some(value => value.isLeader && value !== access.current)
        )
          return HttpResponse.json(
            { code: 'TEAM_LEADER_ALREADY_ASSIGNED' },
            { status: 409 },
          );
        access.current!.isLeader = true;
        return new HttpResponse(null, { status: 204 });
      },
    ),
  ];
}
